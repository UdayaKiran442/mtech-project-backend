FROM --platform=arm64 oven/bun:latest AS builder

WORKDIR /src
COPY . .
RUN bun install

EXPOSE 3000

# Run bun app
CMD ["bun", "run", "dev"]