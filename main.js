// Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const dropdownMenu = document.getElementById('dropdownMenu');

menuToggle.addEventListener('click', () => {
    dropdownMenu.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('active');
    }
});

// Section Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionId).classList.add('active');
    
    // Close menu
    dropdownMenu.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Bot Panel
function showBotPanel() {
    document.getElementById('botModal').classList.add('active');
    dropdownMenu.classList.remove('active');
}

function closeBotPanel() {
    document.getElementById('botModal').classList.remove('active');
    // Reset password section
    document.getElementById('passwordSection').style.display = 'block';
    document.getElementById('botControl').style.display = 'none';
    document.getElementById('botPassword').value = '';
    document.getElementById('passwordError').textContent = '';
}

// Password Check
function checkPassword() {
    const password = document.getElementById('botPassword').value;
    const correctPassword = 'abbcode2024'; // Ganti password di sini
    
    if (password === correctPassword) {
        document.getElementById('passwordSection').style.display = 'none';
        document.getElementById('botControl').style.display = 'block';
        addLog('Password accepted. Access granted.');
    } else {
        document.getElementById('passwordError').textContent = 'Password salah! Coba lagi.';
        // Shake animation
        const lockIcon = document.querySelector('.lock-icon');
        lockIcon.style.animation = 'none';
        setTimeout(() => {
            lockIcon.style.animation = 'shake 0.5s ease';
        }, 10);
    }
}

// Download Function
async function downloadContent() {
    const url = document.getElementById('downloadUrl').value;
    const resultContainer = document.getElementById('downloadResult');
    const loading = document.getElementById('downloadLoading');
    const content = document.getElementById('downloadContent');
    
    if (!url) {
        alert('Masukkan URL terlebih dahulu!');
        return;
    }
    
    // Show loading
    resultContainer.style.display = 'block';
    loading.style.display = 'block';
    content.innerHTML = '';
    
    try {
        // Simulasi API call (ganti dengan endpoint API Anda)
        const response = await fetch('/api/download.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        
        const data = await response.json();
        
        loading.style.display = 'none';
        
        if (data.success) {
            content.innerHTML = `
                <div class="download-item">
                    <img src="${data.thumbnail}" class="download-thumb" alt="Thumbnail">
                    <div class="download-info">
                        <h4>${data.title}</h4>
                        <p>${data.platform} • ${data.duration || 'N/A'}</p>
                    </div>
                    <a href="${data.downloadUrl}" class="download-btn" download>
                        <i class="fas fa-download"></i> Download
                    </a>
                </div>
            `;
        } else {
            content.innerHTML = `<p style="color: #E74C3C; text-align: center;">${data.message || 'Gagal mengunduh. Coba URL lain.'}</p>`;
        }
    } catch (error) {
        loading.style.display = 'none';
        content.innerHTML = `<p style="color: #E74C3C; text-align: center;">Terjadi kesalahan. Coba lagi nanti.</p>`;
        console.error(error);
    }
}

// Image Upload & Preview
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');

uploadArea.addEventListener('click', () => imageInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.background = '#FFF0F3';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.background = '';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.background = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleImageUpload(files[0]);
    }
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
    }
});

let currentImageFile = null;

function handleImageUpload(file) {
    if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB!');
        return;
    }
    
    currentImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('originalImage').src = e.target.result;
        document.getElementById('resultImage').src = e.target.result;
        uploadArea.style.display = 'none';
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Enhance Image
async function enhanceImage(type) {
    const loading = document.getElementById('enhanceLoading');
    const resultImg = document.getElementById('resultImage');
    
    if (!currentImageFile) return;
    
    loading.style.display = 'flex';
    
    const formData = new FormData();
    formData.append('image', currentImageFile);
    formData.append('type', type); // 'hd' atau 'blur'
    
    try {
        const response = await fetch('/api/enhance.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultImg.src = data.resultUrl;
            // Add animation effect
            resultImg.style.opacity = '0';
            setTimeout(() => {
                resultImg.style.opacity = '1';
                resultImg.style.transition = 'opacity 0.5s ease';
            }, 100);
        } else {
            alert('Gagal memproses gambar: ' + data.message);
        }
    } catch (error) {
        console.error(error);
        // Fallback: simulate effect with CSS filter
        if (type === 'blur') {
            resultImg.style.filter = 'blur(5px)';
        } else {
            resultImg.style.filter = 'contrast(1.2) saturate(1.2) sharpen(1)';
        }
    } finally {
        loading.style.display = 'none';
    }
}

// Add log to bot panel
function addLog(message) {
    const logsContent = document.getElementById('logsContent');
    const time = new Date().toLocaleTimeString();
    const logItem = document.createElement('p');
    logItem.className = 'log-item';
    logItem.textContent = `[${time}] ${message}`;
    logsContent.appendChild(logItem);
    logsContent.scrollTop = logsContent.scrollHeight;
}

// Enter key support for password
document.getElementById('botPassword')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
});
