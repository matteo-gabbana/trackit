<?php
declare(strict_types=1);

class Response {
    public static function json(array $data, int $code = 200): void {
        header('Content-Type: application/json');
        http_response_code($code);
        echo json_encode($data);
        exit();
    }

    public static function error(string $message, int $code = 500): void {
        self::json(['error' => $message], $code);
    }
}
