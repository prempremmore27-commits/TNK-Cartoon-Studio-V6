# TNK CARTOON STUDIO V6 — Android Edition

यह Android-first installable PWA starter है। इसे Termux में चलाया जा सकता है और Chrome से Home Screen पर install किया जा सकता है। यह अभी native APK नहीं है।

## इस बिल्ड में काम करने वाली सुविधाएँ
- Premium purple/black mobile interface
- हिंदी कहानी को क्रमवार storyboard scenes में बदलना (Gemini text API)
- Character descriptions को storyboard में दिखाना और हर scene image prompt में continuity context देना
- Scene heading, visual, dialogue, narration और image prompt को अलग-अलग edit करना
- हर scene की अलग image generate, regenerate और download करना
- Storyboard JSON export
- 16:9 / 9:16 prompt setting
- PWA manifest, app icon और service worker (browser support पर निर्भर)
- API key केवल server-side `.env` में

## अभी क्या नहीं बना है
- वास्तविक AI motion-video generation और 10 मिनट MP4 assembly
- 4K render pipeline
- हर किरदार की अलग AI voice synthesis
- Native Android APK packaging

इन सुविधाओं के लिए compatible video/voice models, compute server, storage और rendering pipeline जोड़नी होगी। केवल इस starter से असली वीडियो generate नहीं होता। Free quota/provider availability बदल सकती है।

## Android / Termux पर चलाएँ
1. Termux में project folder में जाएँ।
2. `npm install`
3. `cp .env.example .env`
4. `.env` को Nano से खोलें: `nano .env` और अपनी Gemini API key `GEMINI_API_KEY=...` के रूप में डालें।
5. Development mode: `npm run dev`
6. Android Chrome में `http://localhost:5173` खोलें।
7. Chrome menu → **Add to Home screen** / **Install app** चुनें।

## Production preview
`npm run build` फिर `npm start` चलाएँ और Chrome में `http://localhost:8787` खोलें। PWA installability browser और secure-context rules पर निर्भर करती है; localhost सामान्यतः trusted होता है।

## सावधानी
- API key किसी को न भेजें और GitHub पर `.env` upload न करें।
- AI model availability, quota और billing आपके provider account पर निर्भर हैं।
- यह V6 starter है, Google Flow का पूर्ण विकल्प या 4K movie generator अभी नहीं है।
