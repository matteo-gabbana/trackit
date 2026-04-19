<?php
declare(strict_types=1);

require_once __DIR__ . "/../services/TrenitaliaService.php";
require_once __DIR__ . "/../helpers/Response.php";
require_once __DIR__ . "/../helpers/Validator.php";

class StazioneController {
    public static function autocompleta(): void {
        try {
            $q = Validator::string($_GET["q"] ?? "");
            Validator::required($q);

            $response = TrenitaliaService::fetch("/autocompletaStazione/" . rawurlencode($q), false);
            $lines = explode("\n", $response);
            $stations = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;
                $parts = explode("|", $line, 2);
                if (count($parts) < 2) continue;
                $stations[] = ["nome" => trim($parts[0]), "id" => trim($parts[1])];
            }
            Response::json($stations);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function dettaglio(): void {
        try {
            $id = Validator::string($_GET["id"] ?? "");
            Validator::required($id);

            // Il secondo parametro è la regione; 0 funziona come "tutte le regioni"
            $response = TrenitaliaService::fetch("/dettaglioStazione/{$id}/0");
            if (is_array($response) && isset($response['lat'], $response['lon'])) {
                $nome = $response['localita']['nomeLungo']
                     ?? $response['localita']['nomeBreve']
                     ?? $response['nomeCitta']
                     ?? null;
                Response::json([
                    'lat'  => (float) $response['lat'],
                    'lon'  => (float) $response['lon'],
                    'nome' => $nome,
                ]);
            } else {
                Response::error("Dati stazione non disponibili.", 404);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function partenze(): void {
        try {
            $id = Validator::string($_GET["id"] ?? "");
            Validator::required($id);

            // viaggiatreno richiede il formato RFC tipo "Fri Apr 18 2026 10:00:00 GMT+0200"
            $orario = $_GET["orario"] ?? date("D M d Y H:i:s") . " GMT" . date("O");
            $orario_encoded = rawurlencode($orario);

            $response = TrenitaliaService::fetch("/partenze/{$id}/{$orario_encoded}");
            Response::json($response);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function arrivi(): void {
        try {
            $id = Validator::string($_GET["id"] ?? "");
            Validator::required($id);

            // viaggiatreno richiede il formato RFC tipo "Fri Apr 18 2026 10:00:00 GMT+0200"
            $orario = $_GET["orario"] ?? date("D M d Y H:i:s") . " GMT" . date("O");
            $orario_encoded = rawurlencode($orario);

            $response = TrenitaliaService::fetch("/arrivi/{$id}/{$orario_encoded}");
            Response::json($response);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
