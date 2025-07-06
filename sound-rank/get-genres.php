<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataDir = __DIR__ . '/data';
$genres = [];
$aiSources = [];

if (is_dir($dataDir)) {
    $files = scandir($dataDir);
    
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'csv') {
            // Extract genre and AI source from filename
            $filename = pathinfo($file, PATHINFO_FILENAME);
            $parts = explode('_', $filename);
            
            if (count($parts) === 2) {
                $genre = $parts[0];
                $aiSource = $parts[1];
                
                if (!in_array($genre, $genres)) {
                    $genres[] = $genre;
                }
                
                if (!in_array($aiSource, $aiSources)) {
                    $aiSources[] = $aiSource;
                }
            }
        }
    }
}

// Sort arrays
sort($genres);
sort($aiSources);

echo json_encode([
    'genres' => $genres,
    'aiSources' => $aiSources
]);
?>