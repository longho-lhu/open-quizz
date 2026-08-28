# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, Drizzle ORM, SQLite.

## Users

Both teachers and students. Teachers/educators are creating quizzes, and students are taking them.

## Product Purpose

A quiz platform that allows users to take and manage quizzes, with a focus on AI-assisted workflows.

## Positioning

It allows AI-assisted quiz generation directly from provided documents like PDFs and Excel spreadsheets.

## Operating Context

Educational environments, classrooms, or self-study scenarios where quiz materials need to be rapidly generated from existing reading materials or datasets.

## Capabilities and Constraints

- Next.js application framework.
- Must integrate AI generation (Google GenAI / node-llama-cpp).
- Document parsing capabilities (pdf-parse, exceljs).
- Explicitly avoid Electron (desktop wrapper removed per requirements).

## Brand Commitments

(None established yet)

## Evidence on Hand

- Existing Next.js boilerplate and backend integrations.
- Parsers for Excel and PDF files.

## Product Principles

1. **AI-Empowered Creation:** Reduce the friction of quiz creation by leveraging AI to parse and extract questions from existing documents.
2. **Accessible Learning:** Provide a straightforward and reliable interface for students to consume quizzes.
3. **Web-Native:** Embrace standard web deployment and interfaces, foregoing desktop wrappers for simplicity.
