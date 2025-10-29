# 🤸 Bad Date Picker

> *"The world's most secure date picker"* — nobody, ever

An intentionally frustrating date input that forces users to do jumping jacks for every single digit. Built for the [Bad UX World Cup](https://badux.lol/) by Nordcraft.

[Live at https://bad-date-picker.netlify.app/](https://bad-date-picker.netlify.app/)

## 🎯 The Concept

Why type your birthday like a normal person when you can **sweat for it**? This date picker uses AI-powered pose detection to track jumping jacks. Want to enter your birth month? Better start jumping. Each jump increments the number. No shortcuts, no mercy.

### The Flow of Suffering
1. **Month** (1-12): Jump 1-12 times
2. **Day** (1-31): Jump 1-31 times  
3. **Year** (1909-2025): Jump up to 2025 times 🎉

Yes, if you were born in 2025, that's potentially **2,068 jumping jacks**. I call it "fitness-first UX."

## 🛠️ Tech Stack

- **React 19** + **TypeScript** — Because even bad UX deserves type safety
- **Vite** — Lightning-fast dev server for building things that shouldn't exist
- **TensorFlow.js** + **MoveNet** — Overkill AI for detecting your exhaustion
- **SCSS** — Orange gradients that scream "why did I agree to this?"
- **Lucide React** — Beautiful icons for a terrible experience

## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Start the suffering
bun run dev

# Build for production (if you dare)
bun run build
```

## 🏗️ Architecture

- **8 Components** — Each perfectly crafted to frustrate
- **2 Custom Hooks** — `useCamera` and `usePoseDetection` for that AI magic
- **Real-time Validation** — Errors appear the moment you jump to an invalid number
- **Continuous Detection** — No breaks between stages, keep moving!

## 🎨 Features

- ✅ Real-time pose detection using your webcam
- ✅ Persistent error states (they won't go away, just like regret)
- ✅ Orange gradient theme (because it's the color of warning)
- ✅ Year range validation (1909-2025, no time travelers allowed)
- ✅ Future date prevention (your birthday can't be tomorrow)
- ✅ Zero accessibility considerations (it's a feature!)

## 🤔 FAQ

**Q: Is this a joke?**  
A: It's a very serious entry for a very serious competition about terrible UX.

**Q: Can I cheat using React DevTools?**  
A: Yes, but where's the fun in that? Don't make me add security and validation. Please, don't. I don't want to do that. 

**Q: Why 1909 as the minimum year?**  
A: [Some people are just built different](https://www.bbc.com/news/articles/cy5p7xv4zeyo).

**Q: Will this help me get fit?**  
A: You'll either get abs or give up. Probably give up.

## 📝 License

MIT — Use this to torture your users responsibly
