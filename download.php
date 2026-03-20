<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// API endpoint untuk download konten sosial media
// Implementasi menggunakan yt-dlp atau library serupa

$data = json_decode(file_get_contents('php://input'), true);
$url = $data['url'] ?? '';

if (empty($url)) {
    echo json_encode(['success' => false, 'message' => 'URL tidak valid']);
    exit;
}

// Deteksi platform
$platform = detectPlatform($url);
if (!$platform) {
    echo json_encode(['success' => false, 'message' => 'Platform tidak didukung']);
    exit;
}

try {
    // Gunakan yt-dlp atau API pihak ketiga
    // Ini adalah placeholder - implementasi nyata memerlukan server dengan yt-dlp
    
    $result = [
        'success' => true,
        'platform' => $platform,
        'title' => 'Sample Title',
        'author' => '@username',
        'thumbnail' => 'https://via.placeholder.com/150',
        'type' => 'video',
        'duration' => '00:30',
        'downloadUrl' => $url // Seharusnya URL hasil download
    ];
    
    echo json_encode($result);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function detectPlatform($url) {
    $patterns = [
        'tiktok' => '/tiktok\.com/i',
        'youtube' => '/(youtube\.com|youtu\.be)/i',
        'instagram' => '/instagram\.com/i',
        'pinterest' => '/pinterest\.com/i',
        'facebook' => '/facebook\.com/i',
        'twitter' => '/(twitter\.com|x\.com)/i'
    ];
    
    foreach ($patterns as $name => $pattern) {
        if (preg_match($pattern, $url)) {
            return $name;
        }
    }
    return null;
}
?>
