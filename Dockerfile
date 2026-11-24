FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jre-headless apksigner zipalign aapt adb ca-certificates unzip && aapt version && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY upstream/ ./
COPY auth/ /opt/hai-auth/
RUN node --test /opt/hai-auth/basic-auth.test.mjs && node /opt/hai-auth/install.cjs && node --check /app/server.js
RUN npm ci --omit=dev && test -s tools/apktool.jar && test -s tools/navigation.dex && test -s tools/car.dex && test -s tools/arch.dex && test -s tools/car-support.dex && test -s tools/keyboard.dex && test -f /usr/share/java/apksigner.jar && ln -sf /usr/share/java/apksigner.jar tools/apksigner.jar && ln -sf /usr/bin/zipalign tools/zipalign && mkdir -p work tools/keys tools/framework && chown -R node:node /app
USER node
RUN aapt version
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 CMD node /opt/hai-auth/health.mjs
CMD ["node", "server.js"]
