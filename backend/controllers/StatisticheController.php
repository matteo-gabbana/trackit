<?php
declare(strict_types=1);

require_once __DIR__ . "/../services/TrenitaliaService.php";
require_once __DIR__ . "/../helpers/Response.php";

class StatisticheController {
    public static function get(): void {
        try {
            $timestamp = (int) round(microtime(true) * 1000);
            $response = TrenitaliaService::fetch("/statistiche/{$timestamp}");
            Response::json($response);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
