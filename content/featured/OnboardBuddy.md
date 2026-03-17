---
date: '1'
title: 'Onboard Buddy Alexa Skill'
cover: './OnboardBuddy-demo.png'
external: 'https://xathon.mettl.com/event/internshackathon2020'
tech:
  - Alexa Skills Kit
  - YagMail
  - AWS S3
  - AWS Lambda
showInProjects: true
---

Onboard Buddy is a comprehensive smart flashcard tool for incoming Amazon interns.

Comes preloaded with a set of flashcards useful for incoming interns. Using [Yagmail](https://pypi.org/project/yagmail/), Onboard Buddy can also email you a list of these cards.

Our flashcard algorithm, based on the [Supermemo algorithm](https://www.supermemo.com/en), automatically schedules flashcards to maximise retention. Besides questions and answers, it supports hints and explanations, and looking up the answers to specific flashcards all by talking to Alexa.

Lastly, to determine whether your answer is correct, we use [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) to measure the similarity between the two answers.

_Please note, unfortunately the code on GitHub can't be made public because it was for an internal hackathon. I would, however, be happy to share more about what I learnt in general about building an Alexa Skill._
