<?php

require __DIR__ . '/../vendor/autoload.php';

$expectedDatabase = 'josh_slumber_blis_test';

if (
    getenv('DB_CONNECTION') !== 'mysql' ||
    getenv('DB_DATABASE') !== $expectedDatabase
) {
    fwrite(STDERR, "SAFETY STOP: Unexpected MySQL test configuration.\n");
    exit(1);
}

