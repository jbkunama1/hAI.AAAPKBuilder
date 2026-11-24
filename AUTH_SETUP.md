# Integrierte Basic Auth

Ein Container, ausschließlich highfishNetwork, unveränderter Port 4173. Kein Caddy, kein Zusatznetz. Ein gemeinsamer Benutzer über AUTH_USER und AUTH_PASSWORD in den Portainer-Stackvariablen; keine Standardzugangsdaten. Passwort nicht im Chat oder Repository hinterlegen. Es liegt als Laufzeit-Umgebungsvariable vor und ist für Docker-/Portainer-Administratoren einsehbar. Langes, einzigartiges Passwort verwenden.

Auth wird beim Image-Build vor allen Express-Middlewares eingefügt, einschließlich statischer Dateien, Health-Endpunkt, APIs, Uploads und Downloads. Keine IP-/LAN-Ausnahme. Fehlende oder leere Zugangsdaten verhindern den Start. auth/ liegt außerhalb upstream/; ein geänderter Express-Einstiegspunkt lässt den Build abbrechen, statt ungeschützt zu starten. Der Docker-Healthcheck authentifiziert sich selbst. Beide Build-Workflows testen mit zufälligen temporären CI-Zugangsdaten.

Bereitstellung: erfolgreichen neuen GHCR-Build abwarten, AUTH_USER und AUTH_PASSWORD in Portainer setzen, aktualisierte Compose-Datei laden, Image neu ziehen und vorhandenen Stack aktualisieren. Volumes behalten. Für direkten LAN-Zugriff BIND_IP auf die konkrete LAN-IP des Docker-Hosts setzen. Erst neues Image plus Redeployment aktiviert den Schutz. Alte Images sind weiterhin ungeschützt; reine Compose-Änderung genügt nicht.

Ohne/falsche Zugangsdaten muss jeder Pfad HTTP 401 liefern. Mit richtigen Zugangsdaten müssen Startseite und /api/health funktionieren; anschließend Upload/Download testen. Die Unit- und Smoke-Tests sind vorbereitet; Erfolg des Builds und Hosttests erst nach tatsächlicher Ausführung bestätigt.

HTTP Basic Auth verschlüsselt den Transport nicht: bei http://SERVER-IP:4173 können Zugangsdaten mitgelesen werden. Möglichst HTTPS verwenden; kein anderweitig verwendetes Passwort benutzen. Später aapkbuilder.arbeitermili.eu am HTTPS-Proxy auf aaapkbuilder:4173 im highfishNetwork richten und Authorization weiterleiten. DNS, Zertifikat und Proxy werden hier nicht geändert. Danach HTTP-LAN-Nebenstrecke entfernen/einschränken. Keine MFA, Kontoverwaltung, zuverlässiger Logout oder Login-Ratebegrenzung enthalten.

Diese Anleitung ersetzt ältere README-/Pages-Aussagen zu fehlender Anmeldung und fehlendem externen Netzwerk. Die statische GitHub-Pages-Dokumentation bleibt öffentlich.
