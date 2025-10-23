# Switch-Immich

A Node.js tool that automatically downloads Nintendo Switch screenshots and videos from Nintendo Switch Online and uploads them to [Immich](https://immich.app/), a self-hosted photo and video backup solution.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/uwx/switch-immich.git
cd switch-immich
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Nintendo Switch Online authentication:
```bash
# Authenticate with Nintendo Switch Online
pnpm dlx nxapi@1.6.1-next.242 nso auth --select
```

4. Login with the Immich CLI (`pnpm dlx @immich/cli login <url> <key>`)

## Usage

### Basic Usage

Run the tool to download and upload all Nintendo Switch screenshots and videos:

```bash
pnpm dlx tsx src/index.ts
```

The tool will:
- Download all media from your Nintendo Switch Online account
- Organize files by game/app name
- Create albums in Immich named "Nintendo Switch Screenshots: [Game Name]"
- Preserve original capture timestamps

## Future Features

- Incremental sync (only download new media)

## License

AGPL