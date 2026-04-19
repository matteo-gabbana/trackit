<?php
declare(strict_types=1);

class TrenitaliaService {
    public static function fetch(string $endpoint, bool $isJson = true): mixed {
        $url = TRENITALIA_BASE . $endpoint;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, CURL_TIMEOUT);
        curl_setopt($ch, CURLOPT_USERAGENT, CURL_USERAGENT);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $error_msg = curl_error($ch);
            curl_close($ch);
            throw new Exception("Errore cURL: {$error_msg}");
        }

        curl_close($ch);

        if ($isJson) {
            $data = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Errore decodifica JSON: " . json_last_error_msg());
            }
            return $data;
        } else {
            return $response;
        }
    }
}
