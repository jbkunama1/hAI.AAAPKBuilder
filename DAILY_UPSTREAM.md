# Tägliche Upstream-Updates

Diese Regelung ersetzt die bisherigen README-Angaben zur ausschließlich manuellen Upstream-Aktualisierung.

Der Workflow Daily upstream sync prüft täglich um 03:37 UTC den aktuellen HEAD des Standardbranches von malebuffy/AndroidAutoMaker. Das entspricht 04:37 Uhr MEZ bzw. 05:37 Uhr MESZ. GitHub kann geplante Läufe verzögern; dies ist kein garantiertes 24-Stunden-SLA. Manuell: Actions > Daily upstream sync > Run workflow (main).

Bei neuer Commit-ID wird der vollständige Quellstand nach upstream/ synchronisiert, einschließlich dort entfernter Dateien. Anpassungen direkt unter upstream/ werden damit überschrieben; eigene Erweiterungen außerhalb dieses Verzeichnisses halten. Dockerfile, Compose und eigene Workflows bleiben unangetastet. LICENSE und UPSTREAM.txt werden mitgeführt. Eine abweichende Lizenzdatei stoppt den Lauf zur manuellen Prüfung. Der Abgleich folgt Commits, nicht nur Releases.

Vor der Übernahme auf main erfolgen Docker-Build, Health-Check und Toolchain-Smoke-Tests. Scheitern sie, wird der Quellstand nicht gepusht und beim nächsten Lauf erneut versucht. Ein erfolgreicher Smoke-Test garantiert weder APK-Konvertierung noch Android-Auto-Kompatibilität.

Nach erfolgreichem Push wird ghcr.yml ausdrücklich per workflow_dispatch gestartet, weil ein Push mit GITHUB_TOKEN allein keinen weiteren Push-Workflow auslöst. Der GHCR-Workflow baut und testet erneut und veröffentlicht erst dann latest und den sha-Tag. Schlägt dieser zweite Lauf fehl, bleibt das bisher veröffentlichte Image verfügbar; den fehlgeschlagenen Lauf unter Actions erneut starten. Ein fehlender Dispatch wird beim nächsten täglichen Check nachgeholt, sofern für den aktuellen Commit noch kein GHCR-Lauf existiert.

Benötigt: GITHUB_TOKEN mit contents:write und actions:write sowie erlaubte direkte Pushes auf main. Branch-Schutz oder Organisationsrichtlinien können dies verhindern; der Workflow umgeht sie nicht. Keine zusätzlichen PAT-Secrets nötig. GitHub kann geplante Workflows in inaktiven öffentlichen Repositorys nach 60 Tagen deaktivieren; dann unter Actions reaktivieren.

Portainer wird NICHT automatisch neu deployt. Für Übernahme des neuen Images den Stack mit Re-pull image aktualisieren oder separat eine bewusst konfigurierte Deployment-Automation nutzen. Volumes und Signierschlüssel nicht löschen.
