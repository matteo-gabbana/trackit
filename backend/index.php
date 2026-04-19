<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once __DIR__ . "/config/config.php";
require_once __DIR__ . "/helpers/Response.php";
require_once __DIR__ . "/controllers/StazioneController.php";
require_once __DIR__ . "/controllers/TrenoController.php";
require_once __DIR__ . "/controllers/NewsController.php";
require_once __DIR__ . "/controllers/MeteoController.php";
require_once __DIR__ . "/controllers/StatisticheController.php";
require_once __DIR__ . "/controllers/LinguaController.php";

try {
    $routes = require __DIR__ . "/routes/routes.php";

    $route_param = $_GET["route"] ?? "";

    if (isset($routes[$route_param])) {
        list($controllerName, $methodName) = $routes[$route_param];
        
        // Assicurati che il controller esista e che il metodo sia chiamabile staticamente
        if (class_exists($controllerName) && is_callable([$controllerName, $methodName])) {
            call_user_func([$controllerName, $methodName]);
        } else {
            Response::error("Controller o metodo non trovato o non chiamabile.", 500);
        }
    } else {
        Response::error("Route not found", 404);
    }
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
