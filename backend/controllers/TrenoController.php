<?php
declare(strict_types=1);

require_once __DIR__ . "/../services/TrenitaliaService.php";
require_once __DIR__ . "/../helpers/Response.php";
require_once __DIR__ . "/../helpers/Validator.php";

class TrenoController {
    public static function cercaNumero(): void {
        try {
            $numero = Validator::string($_GET["numero"] ?? "");
            Validator::required($numero);

            // Accetta "REG 20450", "IC 665", "665" — estrae solo la parte numerica
            if (preg_match('/\d+/', $numero, $numMatch)) {
                $numero = $numMatch[0];
            }

            $response = TrenitaliaService::fetch("/cercaNumeroTrenoTrenoAutocomplete/{$numero}", false);
            $response = trim((string) $response);

            if ($response === '') {
                Response::error("Treno non trovato.", 404);
                return;
            }

            // Risposta effettiva: "665 - MILANO CENTRALE - 18/04/26|665-S01700-1776463200000"
            // Dopo il pipe: "{codice}-{codStazione}-{dataPartenza}"
            $firstLine = trim(strtok($response, "\n"));

            if (strpos($firstLine, '|') === false) {
                Response::error("Treno non trovato.", 404);
                return;
            }

            [$displayPart, $codePart] = explode('|', $firstLine, 2);
            $codePart = trim($codePart);

            // Formato: "665-S01700-1776463200000"
            if (!preg_match('/^(\d+)-([A-Za-z][A-Za-z0-9]*)-(\d+)$/', $codePart, $m)) {
                Response::error("Formato risposta ricerca treno non valido.", 400);
                return;
            }

            $codice       = $m[1];
            $codStazione  = $m[2];
            $dataPartenza = $m[3];

            // Nome stazione dalla parte display: "665 - MILANO CENTRALE - 18/04/26"
            $displayPart = trim($displayPart);
            if (preg_match('/^\S+\s+-\s+(.+?)\s+-\s+\S+$/', $displayPart, $dispMatches)) {
                $stazione = trim($dispMatches[1]);
            } else {
                $stazione = $displayPart;
            }

            Response::json([
                "codice"       => $codice,
                "stazione"     => $stazione,
                "codStazione"  => $codStazione,
                "dataPartenza" => $dataPartenza,
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function andamento(): void {
        try {
            $codPartenza = Validator::string($_GET["codPartenza"] ?? "");
            $codTreno = Validator::string($_GET["codTreno"] ?? "");
            $dataPartenza = Validator::string($_GET["dataPartenza"] ?? "");
            Validator::required($codPartenza);
            Validator::required($codTreno);
            Validator::required($dataPartenza);

            $response = TrenitaliaService::fetch("/andamentoTreno/{$codPartenza}/{$codTreno}/{$dataPartenza}");
            Response::json($response);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function tratte(): void {
        try {
            $codPartenza = Validator::string($_GET["codPartenza"] ?? "");
            $codTreno = Validator::string($_GET["codTreno"] ?? "");
            $dataPartenza = Validator::string($_GET["dataPartenza"] ?? "");
            Validator::required($codPartenza);
            Validator::required($codTreno);
            Validator::required($dataPartenza);

            $response = TrenitaliaService::fetch("/tratteCanvas/{$codPartenza}/{$codTreno}/{$dataPartenza}");
            Response::json($response);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
