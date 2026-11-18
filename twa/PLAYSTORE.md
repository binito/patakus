# Patakus Play Store release

Este projeto Android e uma Trusted Web Activity para `https://patakus.cafemartins.pt/app`.

## Identidade nova

- Package name: `pt.patakus.patakus`
- App: `Patakus Operador`
- Launcher: `Patakus`
- Version inicial preparada: `1.0.1` / `versionCode 2`
- Target SDK: Android 15, API 35
- Web manifest: `https://patakus.cafemartins.pt/manifest.json`
- Digital Asset Links: `https://patakus.cafemartins.pt/.well-known/assetlinks.json`

O rascunho antigo da Play Console usava `pt.cafemartins.patakus`. Como package names da Play Store
sao permanentes, para usar `pt.patakus.patakus` deve ser criada uma app nova na Play Console.

## Chave nova

Foi criada uma nova upload/signing key para a app `pt.patakus.patakus`:

```text
/home/jorge/patakus-twa/pt-patakus-patakus-2026-06-15/upload-keystore.jks
/home/jorge/patakus-twa/pt-patakus-patakus-2026-06-15/upload-keystore.password.txt
/home/jorge/patakus-twa/pt-patakus-patakus-2026-06-15/upload_certificate.pem
```

Alias: `upload`

SHA-256:

```text
23:E4:C3:A2:92:B6:81:51:63:42:8E:6C:45:D6:BF:07:6C:89:F4:6E:00:01:A5:9C:D3:CC:B6:7C:03:67:16:BC
```

O `apps/web/public/.well-known/assetlinks.json` ja esta atualizado para `pt.patakus.patakus` com
este fingerprint. Depois do primeiro upload, confirmar na Play Console o certificado em
`App integrity > App signing key certificate`; se a Google usar outro certificado para assinar a app
instalada, o `assetlinks.json` publicado deve usar esse SHA-256.

## Build do Android App Bundle

A Play Store deve receber um `.aab`, nao um `.apk`.

No Mac com Android Studio/Android SDK instalado:

```bash
cd /home/jorge/patakus/twa
./gradlew :app:bundleRelease
```

Antes da build, criar um ficheiro local `signing.properties` em `/home/jorge/patakus/twa`:

```properties
storeFile=/home/jorge/patakus-twa/pt-patakus-patakus-2026-06-15/upload-keystore.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Este ficheiro esta ignorado pelo git.

O ficheiro gerado deve ficar em:

```text
/home/jorge/patakus/twa/app/build/outputs/bundle/release/app-release.aab
```

Confirmar a assinatura:

```bash
keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab
```

## Checklist Play Console

1. Criar uma app nova com package `pt.patakus.patakus`.
2. Completar a ficha da loja: nome, descricao, icone 512x512, feature graphic 1024x500, screenshots.
3. Preencher App access, Data safety, Content rating, Target audience, Ads, Privacy policy.
4. Confirmar que a politica de privacidade esta publicada, por exemplo em `/privacidade`.
5. Criar uma release em Internal testing com o `.aab`.
6. Confirmar o SHA-256 de `App signing key certificate` e atualizar `assetlinks.json` se necessario.
7. Corrigir avisos de pre-review.
8. Promover para Production quando o teste interno estiver ok.

## Notas TWA

A TWA so abre em modo app completo quando o `assetlinks.json` publicado inclui o fingerprint da chave
que assina a app instalada. Se o fingerprint nao bater certo, o Android abre a experiencia como
Custom Tab com barra do navegador.
