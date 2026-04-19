<?php
declare(strict_types=1);

require_once __DIR__ . "/../services/TrenitaliaService.php";
require_once __DIR__ . "/../helpers/Response.php";

class MeteoController {
    public static function get(): void {
        try {
            $response = TrenitaliaService::fetch("/datimeteo/0");
            Response::json($response);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
