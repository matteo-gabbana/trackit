<?php
declare(strict_types=1);

return [
    'stazione/autocompleta' => ['StazioneController', 'autocompleta'],
    'stazione/dettaglio'    => ['StazioneController', 'dettaglio'],
    'stazione/partenze' => ['StazioneController', 'partenze'],
    'stazione/arrivi' => ['StazioneController', 'arrivi'],
    'treno/cerca' => ['TrenoController', 'cercaNumero'],
    'treno/andamento' => ['TrenoController', 'andamento'],
    'treno/tratte' => ['TrenoController', 'tratte'],
    'news' => ['NewsController', 'get'],
    'meteo' => ['MeteoController', 'get'],
    'statistiche' => ['StatisticheController', 'get'],
    'lingua' => ['LinguaController', 'get'],
];
