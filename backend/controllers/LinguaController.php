<?php
declare(strict_types=1);

require_once __DIR__ . "/../services/TrenitaliaService.php";
require_once __DIR__ . "/../helpers/Response.php";
require_once __DIR__ . "/../helpers/Validator.php";

class LinguaController {
    public static function get(): void {
        try {
            $lang = Validator::string($_GET["lang"] ?? "it");

            $response = TrenitaliaService::fetch("/language/{$lang}");
            Response::json($response);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
