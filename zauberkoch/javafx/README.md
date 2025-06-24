```
::::::::: :::.      ...    ::::::::::. .,:::::: :::::::..    :::  .      ...       .,-:::::   ::   .:  
'`````;;; ;;`;;     ;;     ;;; ;;;'';;';;;;'''' ;;;;``;;;;   ;;; .;;,..;;;;;;;.  ,;;;'````'  ,;;   ;;, 
    .n[[',[[ '[[,  [['     [[[ [[[__[[\.[[cccc   [[[,/[[['   [[[[[/' ,[[     \[[,[[[        ,[[[,,,[[[ 
  ,$$P" c$$$cc$$$c $$      $$$ $$""""Y$$$$""""   $$$$$$c    _$$$$,   $$$,     $$$$$$        "$$$"""$$$ 
,888bo,_ 888   888,88    .d888_88o,,od8P888oo,__ 888b "88bo,"888"88o,"888,_ _,88P`88bo,__,o, 888   "88o
 `""*UMM YMM   ""`  "YmmMMMM""""YUMMMP" """"YUMMMMMMM   "W"  MMM "MMP" "YMMMMMP"   "YUMMMMMP"MMM    YMM
```

###### AI driven Spring Boot and Vaadin Web-App

### Building the Application

```mvn clean package -Pproduction```

### Running the Application

There are two ways to run the application:  using `mvn` or by running the `Application` class
directly from your IDE.

# Use cases

## Leckeres Essen

## Gesundes Essen

## Abnehmen / Zunehmen

## Low Carb / High Protein

## Muskelaufbau

## Kostengünstiges Essen

## Medizinischer Nutzen

## Verwertung von Resten

### Todos

* [x] fix error on login
* [x] improve prompt
* [x] fix application error after verifying account with link in mail
* [x] start in last theme
* [x] test without ingredient questionnaire dialog
* [x] add share apiLog view
* [x] improve db
* [x] fix new error on login
* [x] show apiLog history
* [x] store session (keep user logged in)
* [x] qr-image to share
* [x] add new page for sharing
* [x] store response divided in parts (headline, content, ingredients)
* [x] change color of primary color
* [x] add referrals in admin view
* [x] add user control room
* [x] check db connection is closed
* [x] add registration by mail
* [x] add reset pw
* [x] sort in admin view
* [x] fix drunk animation
* [x] improve dialogs in dark theme
* [x] verify oauth2 user automatically
* [x] add close button to dialogs
* [x] improve reset password mail
* [x] improve registration mail
* [x] add animations
* [x] add setting to disable drunk animation
* [x] fix install pwa
* [x] refresh premium view after purchase
* [x] keep paypal button – remove own one and check if error dialog is gone..
* [ ] check subscription's expiry date when user logs in and set this date as premium expiry date
* [ ] check if referrals free premium is added correctly in all subscription states
* [ ] check notification tone and language
* [ ] add daily report
* [ ] add 'Resteküche' (take picture of available ingredients to generate recipe)
* [ ] add more login provider
* [ ] test performance
* [ ] add footer
* [ ] add unit tests
* [ ] backup every 12h and send to webhost
* [ ] add changelog
* [ ] add referral graph
* [ ] add dialog change user state in admin view
* [ ] add supporter view
* [ ] add background images and icons to kidnap peoples' mind
* [ ] .

You can find a text version of the tutorial in
the [Vaadin Documentation](https://vaadin.com/docs/latest/flow/tutorials/in-depth-course).

# Build

**App stoppen!!**

```sh
rm -rf node_modules package-lock.json
mvn vaadin:clean-frontend
mvn vaadin:prepare-frontend
npm install
mvn clean package -Pproduction
```

### Notes

#### Port 8080 already used

```sh
martin@MacBookPro Downloads % lsof -i :8080
COMMAND     PID   USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Google     1095 martin   19u  IPv6 0x9a9ddd1c10b90c6d      0t0  TCP localhost:55482->localhost:http-alt (ESTABLISHED)
Google     1095 martin   47u  IPv6 0x9cc44dbd12521ac4      0t0  TCP localhost:55472->localhost:http-alt (ESTABLISHED)
java      55310 martin  293u  IPv6 0x27e33d0d3feae387      0t0  TCP *:http-alt (LISTEN)
java      55310 martin  302u  IPv6 0x4fbafbffac82b469      0t0  TCP localhost:http-alt->localhost:55472 (ESTABLISHED)
java      55310 martin  303u  IPv6 0xb9a39af70ff849de      0t0  TCP localhost:http-alt->localhost:55482 (ESTABLISHED)
martin@MacBookPro Downloads % kill -9 55310
```

#### ssh Key

```sh
d?9E8k)?up5#',aH.MOF
```

#### DeepSeek API-Key

```shell
sk-ddd86706a99345e1928bd8838350122c
```

#### OpenAI API-Key

```shell
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
```

```
Schreibe eine humorvolle Kurzgeschichte über einen Roboter, 
der versehentlich die Weltherrschaft übernimmt. 
Die Geschichte sollte maximal 500 Wörter haben, 
leicht verständlich geschrieben sein und ein überraschendes Ende haben.
```

🍽️ ZauberKoch Premium – Deine persönliche Rezeptzauberei! 🍽️

✨ Kochen war noch nie so einfach & inspirierend! Mit ZauberKoch Premium holst du dir den vollen
Funktionsumfang unserer smarten Rezept-Web-App – individuell auf dich zugeschnitten, ohne Werbung
und mit exklusiven Features!

🔑 Deine Vorteile mit ZauberKoch Premium:
✅ Personalisierte Rezepte – Basierend auf deinen Vorlieben & Ernährungsstil
✅ KI-gestützte Rezeptvorschläge – Nie wieder Ideenlosigkeit in der Küche
✅ Dynamische Einkaufsliste – Automatisch generiert & immer griffbereit
✅ Meal Planner – Plane deine Woche mit nur wenigen Klicks
✅ Saisonale & gesunde Inspirationen – Immer frische Ideen für deine Ernährung
✅ Exklusive Premium-Inhalte – Besondere Rezepte, Tipps & Insider-Wissen
✅ Keine Werbung – 100% Genuss ohne Ablenkung

📅 Flexible Mitgliedschaft – Keine Verpflichtungen!
🔄 Monatlich kündbar – Teste ohne Risiko
🚀 Sofortiger Zugang – Direkt nach der Anmeldung durchstarten

💡 Werde jetzt ZauberKoch Premium-Mitglied & erlebe die smarte Art zu kochen!

👉 Jetzt abonnieren & loszaubern! 🪄✨

# Ideen

- Integration mit Smart-Küchengeräten?

# SQL Queries

#### Nutzer löschen

```sql
SET @uid = ?;
DELETE
FROM user_settings
WHERE user_id = @uid;
DELETE
FROM users
WHERE id = @uid;
```