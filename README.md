<div align="center">
<img src="docs/assets/banner.svg" alt="hAI.AAAPKBuilder – Self-hosted APK workflow" width="100%">

# hAI.AAAPKBuilder

### Dein Server. Dein Build. Deine Schlüssel.

AndroidAutoMaker als selbst gehosteter Docker-/Portainer-Stack.

[Projektseite](https://jbkunama1.github.io/hAI.AAAPKBuilder/) · [Container-Paket](https://github.com/jbkunama1/hAI.AAAPKBuilder/pkgs/container/hai.aaapkbuilder) · [Actions](https://github.com/jbkunama1/hAI.AAAPKBuilder/actions) · [Issues](https://github.com/jbkunama1/hAI.AAAPKBuilder/issues)

</div>

Die Projektseite ist öffentliche Dokumentation, kein Online-APK-Konverter. Die Anwendung läuft auf deinem Docker-Host. Pages muss separat aktiviert und erfolgreich deployt sein.

## Funktionsumfang und Architektur

- APK-/XAPK-Workflow über die übernommene Weboberfläche. Keine Garantie für die Konvertierbarkeit jeder App oder Android-Auto-Kompatibilität.
- Ein Builder-Container mit integrierter HTTP Basic Auth; kein zusätzlicher Auth-Container.
- Ausschließlich das externe Docker-Netzwerk `highfishNetwork`; es muss auf dem Docker-Endpunkt vorhanden sein.
- Interner Port `4173`, standardmäßig Host-Bindung `127.0.0.1:4173`.
- Persistente Volumes für Jobs, Signierschlüssel und Framework-Cache.
- Täglicher geprüfter Upstream-Abgleich und GHCR-Image-Build. Ein neues Image aktualisiert keinen laufenden Container.

## Installation mit Portainer

Voraussetzung: Docker Standalone auf Linux amd64/x86_64. ARM64 ist nicht vorgesehen.

1. Einen erfolgreichen [GHCR-Build](https://github.com/jbkunama1/hAI.AAAPKBuilder/actions/workflows/ghcr.yml) abwarten. Für anonymen Pull muss das GHCR-Paket öffentlich sein; andernfalls Registry-Zugang mit `read:packages` in Portainer hinterlegen.
2. Prüfen, dass `highfishNetwork` auf demselben Docker-Endpunkt existiert. Der Stack legt kein zusätzliches Netzwerk an.
3. In Portainer einen Repository-Stack anlegen:

| Einstellung | Wert |
|---|---|
| Repository URL | `https://github.com/jbkunama1/hAI.AAAPKBuilder` |
| Reference | `refs/heads/main` |
| Compose path | `docker-compose.yml` |
| Image | `ghcr.io/jbkunama1/hai.aaapkbuilder:latest` |

4. `AUTH_USER` und `AUTH_PASSWORD` als Stack-Variablen setzen. Keine echten Zugangsdaten ins Repository übernehmen.
5. Nur für direkten LAN-Zugriff `BIND_IP` auf die konkrete LAN-IP des Docker-Hosts setzen. Stack deployen und `http://HOST-IP:4173` öffnen. HTTP verschlüsselt die Zugangsdaten nicht; für Fernzugriff HTTPS verwenden.

### Stack-Variablen

| Variable | Standard | Zweck |
|---|---|---|
| `AUTH_USER` | keiner, erforderlich | Gemeinsamer Benutzername; kein Doppelpunkt oder Steuerzeichen |
| `AUTH_PASSWORD` | keiner, erforderlich | Langes, einzigartiges Passwort ohne Steuerzeichen |
| `BIND_IP` | `127.0.0.1` | Host-Bindung; für LAN konkrete Host-LAN-IP setzen |
| `APP_PORT` | `4173` | Veröffentlichter Host-Port |
| `IMAGE_TAG` | `latest` | Beweglicher Stand oder veröffentlichter fester Tag |

Fehlende oder leere Zugangsdaten verhindern den Start des neuen Images. Alte Images ohne Auth-Code werden durch Setzen der Variablen allein nicht geschützt.

### Basic Auth und HTTPS

Die Auth-Middleware wird beim Image-Build vor allen Express-Routen eingebaut. Oberfläche, statische Dateien, API, Uploads, Downloads und `/api/health` sind geschützt, auch im LAN. Der Docker-Healthcheck authentifiziert sich selbst. Details: [AUTH_SETUP.md](AUTH_SETUP.md).

Es gibt keine Standardzugangsdaten, Kontoverwaltung, MFA oder Login-Ratebegrenzung. Das Passwort liegt als Laufzeit-Umgebungsvariable vor und ist für Docker-/Portainer-Administratoren einsehbar. Basic Auth ersetzt keine Transportverschlüsselung.

Für einen vorhandenen HTTPS-Proxy im `highfishNetwork` lautet das Ziel `http://aaapkbuilder:4173`; den `Authorization`-Header weiterreichen. DNS, Zertifikat und Proxy sind separat einzurichten. Die direkte HTTP-Nebenstrecke nach Umstellung entfernen oder einschränken.

### Alternativ per CLI

```bash
git clone https://github.com/jbkunama1/hAI.AAAPKBuilder.git
cd hAI.AAAPKBuilder
# AUTH_USER und AUTH_PASSWORD sicher als Umgebungsvariablen oder
# in einer nicht versionierten .env bereitstellen.
# highfishNetwork muss bereits existieren.
# Für LAN BIND_IP auf die tatsächliche Host-LAN-IP setzen.
docker compose up -d
docker compose ps
```

## Updates und Upstream-Sync

`Daily upstream sync` prüft täglich um 03:37 UTC den HEAD von [malebuffy/AndroidAutoMaker](https://github.com/malebuffy/AndroidAutoMaker). Kandidaten werden gebaut und per Smoke-Test geprüft, bevor sie auf `main` übernommen werden. Danach wird der GHCR-Build ausdrücklich gestartet.

- `upstream/` wird vollständig abgeglichen; eigene Änderungen dort werden überschrieben. Eigene Anpassungen außerhalb dieses Verzeichnisses halten.
- Eine veränderte Upstream-Lizenzdatei stoppt die automatische Übernahme.
- Auth-Tests, Healthcheck und Toolchain-Prüfungen ersetzen keine echte APK-Konvertierung.
- Manuell: Actions → Daily upstream sync → Run workflow auf `main`. Details: [DAILY_UPSTREAM.md](DAILY_UPSTREAM.md).

Für Updates in Portainer erfolgreichen Build abwarten, aktuelle Compose-Datei übernehmen und bestehenden Stack mit erneutem Image-Pull aktualisieren. Stacknamen und Volumes beibehalten. CLI-Äquivalent bei gesetzten Variablen:

```bash
docker compose pull
docker compose up -d
```

## Daten und Backup

| Volume | Containerpfad | Inhalt |
|---|---|---|
| `aaapk_keys` | `/app/tools/keys` | Private Signierschlüssel und Passwortdateien |
| `aaapk_work` | `/app/work` | Temporäre Jobs und Ausgaben |
| `aaapk_framework` | `/app/tools/framework` | Framework-Cache |

Compose ergänzt normalerweise den Stacknamen. Für konsistente Backups Container stoppen, Volumes sichern und UID/GID 1000 erhalten. Schlüssel und Passwortdateien gemeinsam sichern und nie committen. Schlüsselverlust kann spätere Update-Installationen verhindern. `docker compose down -v` löscht Volumes und ist kein Updatebefehl. Jobstatus liegt zusätzlich im RAM; Neustarts setzen laufende Jobs zurück.

## Fehlerdiagnose

### Abbruch bei Adding the navigation screen

Nach erfolgreichem Erzeugen von `unsigned.apk` fügt `addNavigationDex` die Navigationsbibliotheken hinzu. Dafür liest ein separates `aapt dump resources` Ressourcen-IDs aus der APK. Das von apktool beim Build verwendete Werkzeug ersetzt diese Abhängigkeit nicht.

Seit Commit `aa84840d0c6fadbcb727a8308969cb9313be4b64` installiert das Dockerfile `aapt` ausdrücklich, prüft `aapt version` auch als Container-Benutzer und prüft die benötigten DEX-Dateien auf nichtleeren Inhalt. Der Fix behebt eine fehlende explizite Container-Abhängigkeit; die Ursache eines konkreten Jobs ist ohne dessen tatsächliche Exception nicht abschließend bewiesen.

Nach erfolgreichem Image-Build neu pullen, Stack aktualisieren und dieselbe APK erneut testen. Zur rein lesenden Kontrolle im laufenden Container:

```bash
docker compose exec aaapkbuilder aapt version
docker compose logs --tail=100 aaapkbuilder
docker compose ps
```

Bleibt der Fehler, vollständiges Joblog und tatsächliche Exception prüfen. `This package could not be converted.` ist keine konkrete Diagnose.

| Problem | Prüfen |
|---|---|
| Image nicht gefunden | Actions-Build, Image-Name und Tag |
| Registry verweigert Pull | GHCR-Sichtbarkeit bzw. Registry-Anmeldung |
| Stack startet nicht | `AUTH_USER`, `AUTH_PASSWORD` und vorhandenes `highfishNetwork` |
| HTTP 401 | Zugangsdaten; bei Proxy Weiterleitung von `Authorization` |
| Verbindung scheitert | `BIND_IP`, Host-Port, Netzwerk und Firewall |
| Permission denied | Schreibrechte der Volumes für UID 1000 |
| Unhealthy | Containerlogs; Health-Endpunkt benötigt ebenfalls Auth |
| Speicherfehler | Logs, Containerlimit und tatsächliche Java-Heap-Argumente |

Lokaler Build nach Quellimport: `docker build -t hai-aaapkbuilder .`.

## Sicherheit und Grenzen

- Nur vertrauenswürdige APKs verarbeiten, für die die nötigen Rechte vorliegen. Das Dekodieren fremder Archive ist nicht risikofrei.
- Non-root-Laufzeit als `node` (UID 1000), ohne privileged, Docker-Socket oder USB-Freigabe. Compose begrenzt den Container auf 2 GiB und setzt `JAVA_TOOL_OPTIONS=-Xmx1024m`; Upstream-Aufrufe können eigene Heap-Argumente angeben.
- Die optionale ADB-Telefoninstallation braucht eine gesonderte Verbindung zum Server/Container. Ein Telefon am Browser-Client ist nicht automatisch verbunden.
- Ursprüngliche Navigation-/Spendenfunktionen bleiben erhalten; Zahlungsdaten werden nicht eingerichtet.
- Nur im geparkten Fahrzeug testen. Keine ablenkenden Anwendungen während der Fahrt verwenden.

## GitHub Pages

Die Projektseite liegt in `docs/index.html`, das Banner in `docs/assets/banner.svg`. Der Pages-Workflow veröffentlicht ausschließlich `docs/`, nicht den Anwendungsserver. Unter Settings → Pages GitHub Actions wählen. Vorgesehene URL: `https://jbkunama1.github.io/hAI.AAAPKBuilder/`. Diese README-Änderung aktiviert Pages nicht und aktualisiert nicht den Text der separaten Landingpage.

## Herkunft und Lizenz

Grundlage: [AndroidAutoMaker von malebuffy](https://github.com/malebuffy/AndroidAutoMaker). Der importierte Quellstand steht in [UPSTREAM.txt](UPSTREAM.txt). Originaldateien und Lizenzhinweise bleiben unter `upstream/` erhalten; Fremdkomponenten behalten ihre jeweiligen Lizenzen. Dieses Projekt ergänzt Containerisierung, CI, integrierte Authentifizierung und Dokumentation. Lizenz: [GPL-3.0-only](LICENSE). Kein offizielles Google-/Android-Auto-Angebot.

## Prüfstatus

Stand 24. November 2026: Basic-Auth-Commit `d58427f96ba275f2b46c90a3439013bdb437aac9` und aapt-Fix `aa84840d0c6fadbcb727a8308969cb9313be4b64` sind auf `main` gepusht. Erfolgreiche GHCR-Builds dieser Stände, Deployment auf dem Zielhost und ein erfolgreicher realer Navigation-Konvertierungstest sind im bisherigen Projektverlauf nicht bestätigt. Diese Schritte sind getrennt zu prüfen; eine Dokumentationsänderung ist kein Testnachweis.
