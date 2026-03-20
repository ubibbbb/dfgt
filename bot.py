import logging
import os
import requests
import json
from io import BytesIO
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, 
    CommandHandler, 
    MessageHandler, 
    CallbackQueryHandler, 
    filters, 
    ContextTypes
)

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'https://yourdomain.com/api')
BOT_PASSWORD = os.getenv('BOT_PASSWORD', 'abbcode2024')

# Command Handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send welcome message"""
    welcome_text = (
        "👋 *Selamat Datang di AbbCode Bot!*\n\n"
        "📥 *Fitur Download:*\n"
        "• Kirim link TikTok, YouTube, Instagram, Pinterest, Facebook, atau Twitter\n"
        "• Bot akan otomatis mendownload dan mengirim file\n\n"
        "🖼 *Fitur Enhance:*\n"
        "• Kirim foto atau video\n"
        "• Pilih tombol *HD* untuk jernihkan atau *Blur* untuk buramkan\n\n"
        "⚡ Cepat, Gratis, dan Berkualitas!\n"
        "🌐 Website: [AbbCode](https://yourdomain.com)"
    )
    
    await update.message.reply_text(
        welcome_text,
        parse_mode='Markdown',
        disable_web_page_preview=True
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Send help message"""
    help_text = (
        "📖 *Cara Penggunaan:*\n\n"
        "1️⃣ *Download Konten:*\n"
        "   • Kirim link sosial media\n"
        "   • Tunggu proses download\n"
        "   • File akan dikirim otomatis\n\n"
        "2️⃣ *Enhance Foto/Video:*\n"
        "   • Kirim media ke bot\n"
        "   • Pilih tombol yang muncul\n"
        "   • Hasil akan dikirim dalam hitungan detik\n\n"
        "💡 *Tips:*\n"
        "• Pastikan link valid dan publik\n"
        "• Untuk video, ukuran maksimal 50MB\n"
        "• Foto optimal dalam format JPG/PNG"
    )
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages (links)"""
    text = update.message.text
    
    # Check if it's a URL
    if not text.startswith(('http://', 'https://')):
        await update.message.reply_text(
            "❌ Kirim link yang valid dari TikTok, YouTube, Instagram, dll.\n"
            "Atau kirim /help untuk bantuan."
        )
        return
    
    # Check if user provided password for bot activation (admin only)
    if text.startswith('https://activate_'):
        password = text.replace('https://activate_', '')
        if password == BOT_PASSWORD:
            # Store token logic here
            await update.message.reply_text("✅ Bot activated successfully!")
            return
    
    # Show processing message
    processing_msg = await update.message.reply_text("⏳ Sedang menganalisis link...")
    
    try:
        # Call download API
        response = requests.post(
            f"{API_BASE_URL}/download.php",
            json={'url': text},
            timeout=30
        )
        data = response.json()
        
        if not data.get('success'):
            await processing_msg.edit_text(
                f"❌ Gagal mendownload: {data.get('message', 'Unknown error')}"
            )
            return
        
        # Update processing message
        await processing_msg.edit_text("📥 Sedang mendownload konten...")
        
        # Prepare caption with source info
        platform_emoji = {
            'tiktok': '🎵',
            'youtube': '📺',
            'instagram': '📸',
            'pinterest': '📌',
            'facebook': '📘',
            'twitter': '🐦'
        }
        
        emoji = platform_emoji.get(data['platform'], '📎')
        caption = (
            f"{emoji} *{data['title'][:100]}*\n"
            f"👤 Sumber: `{data['author']}`\n"
            f"📱 Platform: {data['platform'].title()}\n"
            f"⏱ Durasi: {data.get('duration', 'N/A')}\n\n"
            f"📥 Downloaded via [AbbCode](https://yourdomain.com)"
        )
        
        # Download file from URL and send to user
        file_url = data['downloadUrl']
        
        # For demo purposes, if it's a direct URL, we send it
        # In production, you'd download then re-upload to Telegram
        if data['type'] == 'video':
            await update.message.reply_video(
                video=file_url,
                caption=caption,
                parse_mode='Markdown',
                supports_streaming=True
            )
        else:
            await update.message.reply_photo(
                photo=file_url,
                caption=caption,
                parse_mode='Markdown'
            )
        
        # Delete processing message
        await processing_msg.delete()
        
    except requests.exceptions.Timeout:
        await processing_msg.edit_text("⏱ Waktu habis. Link mungkin terlalu besar atau server sibuk.")
    except Exception as e:
        logger.error(f"Error in handle_text: {e}")
        await processing_msg.edit_text("❌ Terjadi kesalahan. Coba lagi nanti.")

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle photo uploads"""
    # Store photo info in user_data
    photo = update.message.photo[-1]  # Get highest resolution
    context.user_data['photo_file_id'] = photo.file_id
    context.user_data['photo_type'] = 'photo'
    
    # Create inline keyboard
    keyboard = [
        [
            InlineKeyboardButton("✨ HD (Jernihkan)", callback_data='enhance_hd'),
            InlineKeyboardButton("💧 Blur (Buramkan)", callback_data='enhance_blur')
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🖼 Pilih efek yang diinginkan:",
        reply_markup=reply_markup
    )

async def handle_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle video uploads"""
    video = update.message.video
    context.user_data['video_file_id'] = video.file_id
    context.user_data['photo_type'] = 'video'
    
    keyboard = [
        [
            InlineKeyboardButton("✨ HD (Jernihkan)", callback_data='enhance_hd_video'),
            InlineKeyboardButton("💧 Blur (Buramkan)", callback_data='enhance_blur_video')
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🎥 Pilih efek yang diinginkan untuk video:",
        reply_markup=reply_markup
    )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline button presses"""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    is_video = 'video' in data
    enhance_type = 'hd' if 'hd' in data else 'blur'
    
    # Send processing message
    processing_msg = await query.message.reply_text(
        "🎨 AI sedang memproses... (estimasi 10-30 detik)"
    )
    
    try:
        # Get file
        if is_video:
            file_id = context.user_data.get('video_file_id')
            file_type = 'video'
        else:
            file_id = context.user_data.get('photo_file_id')
            file_type = 'photo'
        
        if not file_id:
            await processing_msg.edit_text("❌ File tidak ditemukan. Kirim ulang.")
            return
        
        # Get file from Telegram
        file = await context.bot.get_file(file_id)
        file_bytes = await file.download_as_bytearray()
        
        # Send to API
        files = {'image': ('file.jpg', BytesIO(file_bytes), 'image/jpeg')}
        payload = {'type': enhance_type}
        
        response = requests.post(
            f"{API_BASE_URL}/enhance.php",
            files=files,
            data=payload,
            timeout=60
        )
        
        result = response.json()
        
        if not result.get('success'):
            await processing_msg.edit_text(f"❌ Gagal memproses: {result.get('message')}")
            return
        
        # Send result
        result_url = result['resultUrl']
        
        if is_video:
            await query.message.reply_video(
                video=result_url,
                caption=f"✅ Proses selesai! Efek: *{enhance_type.upper()}*\nVia AbbCode Bot",
                parse_mode='Markdown'
            )
        else:
            await query.message.reply_photo(
                photo=result_url,
                caption=f"✅ Proses selesai! Efek: *{enhance_type.upper()}*\nVia AbbCode Bot",
                parse_mode='Markdown'
            )
        
        await processing_msg.delete()
        
        # Clean up user_data
        if is_video:
            context.user_data.pop('video_file_id', None)
        else:
            context.user_data.pop('photo_file_id', None)
            
    except Exception as e:
        logger.error(f"Error in button_callback: {e}")
        await processing_msg.edit_text("❌ Terjadi kesalahan saat memproses. Coba lagi.")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error(f"Update {update} caused error {context.error}")

def main():
    """Start the bot"""
    token = os.getenv('BOT_TOKEN')
    
    if not token:
        logger.error("No BOT_TOKEN provided!")
        return
    
    # Create application
    application = Application.builder().token(token).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    application.add_handler(MessageHandler(filters.VIDEO, handle_video))
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Add error handler
    application.add_error_handler(error_handler)
    
    # Start polling
    logger.info("Bot started!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
