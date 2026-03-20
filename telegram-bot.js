let botRunning = false;
let botToken = '';
let webhookUrl = '';

function startBot() {
    const token = document.getElementById('botToken').value.trim();
    
    if (!token || !token.includes(':')) {
        alert('Masukkan token bot yang valid!');
        return;
    }
    
    botToken = token;
    botRunning = true;
    
    // Update UI
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    statusDot.classList.remove('offline');
    statusDot.classList.add('online');
    statusText.textContent = 'Bot Online';
    
    addLog('Bot started with token: ' + token.substring(0, 10) + '...');
    addLog('Setting up webhook...');
    
    // Setup webhook (simulasi)
    setupWebhook();
    
    // Start polling (simulasi untuk demo frontend)
    simulateBotActivity();
}

function setupWebhook() {
    // Dalam implementasi nyata, panggil API backend untuk set webhook
    // fetch('/api/bot-webhook.php', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ token: botToken, action: 'set' })
    // });
    
    addLog('Webhook configured successfully');
    addLog('Bot is now listening for updates...');
}

function stopBot() {
    botRunning = false;
    
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    statusDot.classList.remove('online');
    statusDot.classList.add('offline');
    statusText.textContent = 'Bot Offline';
    
    addLog('Bot stopped');
}

// Simulasi aktivitas bot untuk demo
function simulateBotActivity() {
    if (!botRunning) return;
    
    const activities = [
        'Received message from user @john_doe',
        'Processing download request...',
        'Download completed: video_123.mp4',
        'Received image for enhancement',
        'Applying HD filter...',
        'Enhancement completed',
        'New user started: @jane_smith',
        'Sending inline keyboard...'
    ];
    
    setInterval(() => {
        if (botRunning && Math.random() > 0.7) {
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            addLog(randomActivity);
        }
    }, 5000);
}

// Fungsi untuk backend Python bot (nanti diimplementasikan di server)
/*
Backend Python Script Structure (telegram-bot/bot.py):

import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
import requests
import os

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

# Command /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Selamat datang di AbbCode Bot!\n\n"
        "📥 Kirim link TikTok, YouTube, Instagram, atau Pinterest untuk download\n"
        "🖼 Kirim foto untuk enhance atau blur\n\n"
        "Made with ❤️ by AbbCode"
    )

# Handle text (links)
async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    
    # Check if it's a URL
    if url.startswith(('http://', 'https://')):
        processing_msg = await update.message.reply_text("⏳ Sedang memproses link...")
        
        # Call download API
        try:
            response = requests.post('YOUR_API_URL/download', json={'url': url})
            data = response.json()
            
            if data['success']:
                # Send file with caption
                caption = f"📥 *Downloaded from AbbCode*\n"
                caption += f"👤 Sumber: {data['author']}\n"
                caption += f"📱 Platform: {data['platform']}"
                
                if data['type'] == 'video':
                    await update.message.reply_video(
                        video=data['download_url'],
                        caption=caption,
                        parse_mode='Markdown'
                    )
                else:
                    await update.message.reply_photo(
                        photo=data['download_url'],
                        caption=caption,
                        parse_mode='Markdown'
                    )
                
                await processing_msg.delete()
            else:
                await processing_msg.edit_text("❌ Gagal mendownload. Pastikan link valid.")
                
        except Exception as e:
            logger.error(f"Error: {e}")
            await processing_msg.edit_text("❌ Terjadi kesalahan. Coba lagi nanti.")

# Handle photos
async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton("✨ HD (Jernih)", callback_data='enhance_hd'),
            InlineKeyboardButton("💧 Blur (Burik)", callback_data='enhance_blur')
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Save photo file_id for later processing
    context.user_data['photo_file_id'] = update.message.photo[-1].file_id
    
    await update.message.reply_text(
        "🖼 Pilih efek yang diinginkan:",
        reply_markup=reply_markup
    )

# Handle callback (inline buttons)
async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    action = query.data  # 'enhance_hd' atau 'enhance_blur'
    
    processing_msg = await query.message.reply_text("⏳ AI sedang memproses...")
    
    try:
        # Get photo and process
        file_id = context.user_data.get('photo_file_id')
        
        # Download file
        file = await context.bot.get_file(file_id)
        
        # Call enhance API
        files = {'image': file.download_as_bytearray()}
        data = {'type': 'hd' if action == 'enhance_hd' else 'blur'}
        
        response = requests.post('YOUR_API_URL/enhance', files=files, data=data)
        result = response.json()
        
        if result['success']:
            # Send processed image
            await query.message.reply_photo(
                photo=result['result_url'],
                caption="✅ Proses selesai! Hasil by AbbCode"
            )
            await processing_msg.delete()
        else:
            await processing_msg.edit_text("❌ Gagal memproses gambar.")
            
    except Exception as e:
        logger.error(f"Error: {e}")
        await processing_msg.edit_text("❌ Terjadi kesalahan.")

def main():
    # Get token from environment variable
    token = os.getenv('BOT_TOKEN')
    
    application = Application.builder().token(token).build()
    
    # Handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Run
    application.run_polling()

if __name__ == '__main__':
    main()
*/
