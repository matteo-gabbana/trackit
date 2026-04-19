<?php
declare(strict_types=1);

class Validator {
    public static function string(string $input): string {
        return trim(strip_tags($input));
    }

    public static function int(string $input): int {
        return (int) $input;
    }

    public static function required(mixed $value): void {
        if (empty($value) && $value !== 0 && $value !== '0') {
            throw new Exception('Campo richiesto mancante.');
        }
    }
}
