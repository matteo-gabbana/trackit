<?php
declare(strict_types=1);

require_once __DIR__ . "/../helpers/Response.php";
require_once __DIR__ . "/../helpers/Validator.php";
require_once __DIR__ . "/../config/config.php";

class NewsController {
    public static function get(): void {
        try {
            $lang = Validator::string($_GET["lang"] ?? "it");

            // when:30d filtra automaticamente agli ultimi 30 giorni
            if ($lang === 'en') {
                $q    = urlencode('italian railways trenitalia trains when:30d');
                $hl   = 'en'; $gl = 'US'; $ceid = 'US:en';
            } else {
                $q    = urlencode('trenitalia ferrovie treni Italia when:30d');
                $hl   = 'it'; $gl = 'IT'; $ceid = 'IT:it';
            }

            $url = "https://news.google.com/rss/search?q={$q}&hl={$hl}&gl={$gl}&ceid={$ceid}";

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL            => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => CURL_TIMEOUT,
                CURLOPT_USERAGENT      => CURL_USERAGENT,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            $rss = curl_exec($ch);
            if (curl_errno($ch)) {
                throw new Exception("Errore fetch news: " . curl_error($ch));
            }
            curl_close($ch);

            libxml_use_internal_errors(true);
            $xml = simplexml_load_string((string) $rss);
            if (!$xml) {
                throw new Exception("Errore parsing RSS news");
            }

            // Soglia: 30 giorni fa (scorrevole nel tempo)
            $cutoff = time() - 30 * 86400;

            $items = [];
            foreach ($xml->channel->item as $item) {
                $pubTs = strtotime((string) $item->pubDate);
                if ($pubTs === false || $pubTs < $cutoff) continue;

                // Rimuovi il suffisso sorgente " - NomeTestata" dal titolo
                $title = preg_replace('/\s+-\s+[^-]+$/', '', (string) $item->title);

                $desc = strip_tags((string) $item->description);
                if (mb_strlen($desc) > 250) {
                    $desc = mb_substr($desc, 0, 250) . '…';
                }

                $items[] = [
                    'titolo' => trim($title),
                    'testo'  => trim($desc),
                    'data'   => $pubTs * 1000,
                    'url'    => (string) $item->link,
                ];

                if (count($items) >= 20) break;
            }

            Response::json($items);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
