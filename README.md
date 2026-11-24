# hAI.AAAPKBuilder

AndroidAutoMaker für selbst gehostetes Docker/Portainer-Deployment mit GHCR-Build. Abgeleitet von https://github.com/malebuffy/AndroidAutoMaker unter GPL-3.0-only. Kein offizielles Google-Projekt.

## Herkunft und Lizenz

Der erste Actions-Lauf importiert den vollständigen Upstream-Commit `9b83522e57ee35eadb9e779dcdf19a7266751ae1` einschließlich Binärdateien, Original-README und Lizenz nach `upstream/` und committet ihn auf main. Die Original-Lizenz wird zusätzlich als `LICENSE` ins Hauptverzeichnis kopiert. `UPSTREAM.txt` hält die Herkunft fest. Fremdkomponenten behalten ihre Lizenzen. Änderungen dieses Projekts: Containerisierung, CI und deutsche Dokumentation (24.11.2026). Upstream wird nach dem Erstimport nicht automatisch überschrieben.

## Erststart und GHCR

Unter Actions den Workflow `Import upstream and publish GHCR` prüfen. Er startet bei Push auf main oder manuell mit Run workflow. Er benötigt contents:write für den Quellimport und packages:write für GHCR; Repository-Richtlinien dürfen diese Rechte nicht blockieren. Nach erfolgreichem Import, Build und Smoke-Test steht `ghcr.io/jbkunama1/hai.aaapkbuilder:latest` bereit. Es werden außerdem sha-Tags und bei Git-Tags mit Präfix v entsprechende Versions-Tags veröffentlicht. Das eingebaute GITHUB_TOKEN genügt; keine persönlichen Tokens committen.

Im GitHub-Profil unter Packages die Sichtbarkeit des Container-Pakets prüfen und bei Bedarf auf Public setzen. Ein öffentliches Repository garantiert nicht automatisch ein öffentliches GHCR-Paket. Alternativ Registry-Zugang in Portainer hinterlegen (Token mit read:packages).

## Portainer

Voraussetzung: Docker Standalone auf Linux amd64/x86_64. ARM64 ist zunächst nicht unterstützt.

1. Stacks > Add stack > Repository.
2. URL: `https://github.com/jbkunama1/hAI.AAAPKBuilder`
3. Reference: `refs/heads/main`, Compose path: `docker-compose.yml`.
4. Variablen setzen und Deploy the stack ausführen. Alternativ Compose in den Web editor kopieren. Es ist kein Build auf deinem Server nötig.

| Variable | Standard | Zweck |
|---|---|---|
| APP_PORT | 4173 | Port am Host |
| BIND_IP | 127.0.0.1 | Bindung; für LAN die konkrete LAN-IP des Hosts setzen |
| IMAGE_TAG | latest | Image-Version |

Standardmäßig ist der Dienst nur lokal am Docker-Host erreichbar. Für LAN-Zugriff BIND_IP auf dessen LAN-IP setzen, dann `http://HOST-IP:4173` öffnen. Für einen separaten Reverse-Proxy-Container eine passende gemeinsame Netzwerkverbindung konfigurieren; dessen localhost ist nicht der App-Container.

## Sicherheit und Funktionsumfang

Die Upstream-Anwendung hat keine allgemeine Benutzeranmeldung. Niemals ungeschützt im Internet veröffentlichen; für Fernzugriff VPN oder authentifizierenden HTTPS-Proxy verwenden. Nur vertrauenswürdige APKs mit den erforderlichen Nutzungsrechten verarbeiten. Das Dekodieren fremder Archive ist nicht risikofrei. Der Container läuft als node (UID 1000), ohne privileged, Docker-Socket oder USB-Freigabe.

Standardablauf: APK/XAPK hochladen, verarbeiten und Ergebnis herunterladen. Die optionale ADB-Installation benötigt eine gesonderte Verbindung vom Server/Container zum Telefon und ist im Standardstack nicht eingerichtet. Ein Telefon am Browser-Client ist nicht automatisch mit dem Server verbunden. Upstream-Oberfläche, Navigation-/Spendenfunktionen und deren Konfigurationsanforderungen bleiben unverändert; Zahlungsdaten werden nicht eingerichtet. Details stehen in upstream/README.md. Android-Auto-Kompatibilität ist nicht garantiert. Nur im geparkten Fahrzeug testen, keine ablenkenden Anwendungen während der Fahrt verwenden.

## Persistenz und Backup

- aaapk_keys -> /app/tools/keys: private Signierschlüssel UND Passwortdateien gemeinsam sichern, vertraulich halten, nie committen. Schlüsselverlust kann spätere Update-Installationen verhindern.
- aaapk_work -> /app/work: temporäre Jobs und Ausgaben; Upstream bereinigt abgeschlossene Jobs zeitabhängig.
- aaapk_framework -> /app/tools/framework: Framework-Cache.

Compose stellt den Stacknamen vor die Volume-Namen. Für konsistente Backups den Container stoppen und Volumes sichern; bei Wiederherstellung UID/GID 1000 erhalten. Der Jobstatus liegt zusätzlich im RAM: Neustarts setzen laufende Jobs zurück.

## Updates und lokale Builds

Nach erfolgreichem Workflow in Portainer den Stack mit Re-pull image aktualisieren. Volumes nicht löschen. Für feste Stände IMAGE_TAG auf einen Versions- oder sha-Tag setzen. Upstream-Code nach dem Erstimport bewusst prüfen und manuell aktualisieren. Lokal nach abgeschlossenem Quellimport: `docker build -t hai-aaapkbuilder .`

## Troubleshooting

- Image not found: initialen Actions-Build prüfen und abwarten.
- Denied/Unauthorized: GHCR-Sichtbarkeit oder Registry-Zugang prüfen.
- 403 beim Import: Actions-Schreibrechte und Repository-Richtlinien prüfen.
- Verbindung scheitert: BIND_IP, Firewall und Host-Port prüfen.
- Permission denied: Schreibrechte der Volumes für UID 1000 prüfen.
- Unhealthy: Containerlogs und /api/health prüfen.
- Speicherfehler: Logs prüfen und bei Bedarf mem_limit sowie JAVA_TOOL_OPTIONS gemeinsam erhöhen (Standard: 2 GiB Containerlimit, 1 GiB Java-Heap).

Die CI prüft Start, Health-Endpunkt und Toolchain, nicht die vollständige Konvertierung einer realen APK. Der erste Build und ein anschließender APK-Praxistest müssen noch erfolgreich durchlaufen.
