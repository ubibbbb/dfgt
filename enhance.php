<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// API untuk enhance atau blur gambar
// Menggunakan GD library atau ImageMagick

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$type = $_POST['type'] ?? 'hd'; // 'hd' atau 'blur'

if (!isset($_FILES['image'])) {
    echo json_encode(['success' => false, 'message' => 'No image uploaded']);
    exit;
}

$file = $_FILES['image'];
$uploadDir = '../uploads/';
$processedDir = '../processed/';

// Create directories if not exist
if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
if (!is_dir($processedDir)) mkdir($processedDir, 0777, true);

$filename = uniqid() . '_' . basename($file['name']);
$uploadPath = $uploadDir . $filename;
$processedPath = $processedDir . 'processed_' . $filename;

if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    // Process image
    if (processImage($uploadPath, $processedPath, $type)) {
        $resultUrl = '/processed/' . 'processed_' . $filename;
        echo json_encode([
            'success' => true,
            'resultUrl' => $resultUrl,
            'type' => $type
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to process image']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
}

function processImage($input, $output, $type) {
    // Load image
    $info = getimagesize($input);
    if (!$info) return false;
    
    $mime = $info['mime'];
    
    switch ($mime) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($input);
            break;
        case 'image/png':
            $image = imagecreatefrompng($input);
            break;
        case 'image/webp':
            $image = imagecreatefromwebp($input);
            break;
        default:
            return false;
    }
    
    if ($type === 'blur') {
        // Apply blur filter
        for ($i = 0; $i < 15; $i++) {
            imagefilter($image, IMG_FILTER_GAUSSIAN_BLUR);
        }
        imagefilter($image, IMG_FILTER_SMOOTH, -10);
    } else {
        // Enhance (sharpen + contrast + brightness)
        imagefilter($image, IMG_FILTER_CONTRAST, -20);
        imagefilter($image, IMG_FILTER_BRIGHTNESS, 10);
        
        // Sharpen
        $sharpen = array(
            array(-1, -1, -1),
            array(-1, 16, -1),
            array(-1, -1, -1)
        );
        $divisor = array_sum(array_map('array_sum', $sharpen));
        imageconvolution($image, $sharpen, $divisor, 0);
    }
    
    // Save result
    switch ($mime) {
        case 'image/jpeg':
            imagejpeg($image, $output, 90);
            break;
        case 'image/png':
            imagepng($image, $output, 6);
            break;
        case 'image/webp':
            imagewebp($image, $output, 90);
            break;
    }
    
    imagedestroy($image);
    return true;
}
?>
