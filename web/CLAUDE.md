# Web Package - HC Web Interface

## Overview

The `web` package provides a web-based interface for Homoiconic C. It includes
both a standalone static webpage and a Deno Fresh development server for
interactive HC execution in the browser.

## Key Components

### Entry Points

- [static/index.html](static/index.html) - Standalone web interface (can be
  opened directly in a browser)
- [main.ts](main.ts) - Fresh framework server entry point
- [dev.ts](dev.ts) - Development server with hot reload

### Configuration

- [fresh.config.ts](fresh.config.ts) - Fresh framework configuration
- [twind.config.ts](twind.config.ts) - TailwindCSS configuration via Twind
- [fresh.gen.ts](fresh.gen.ts) - Auto-generated Fresh manifest
- [deno.json](deno.json) - Package configuration and tasks

### Application Structure

- [routes/](routes/) - Fresh routes (pages and API endpoints)
- [islands/](islands/) - Interactive Preact components (client-side)
- [static/](static/) - Static assets (CSS, JS, images)
- [tests/](tests/) - Test files

### Main Module

- [mod.ts](mod.ts) - Public API exports for the web package

## Usage

### Standalone Static Page

The simplest way to use the web interface:

```bash
open static/index.html
```

This opens a fully functional HC interpreter in your browser without requiring a
server.

### Development Server

For development with hot reload:

```bash
deno task start
# or from root: deno task web:start
```

Then open http://localhost:8000

### Quick Test Workflow

```bash
# Open static page
open static/index.html

# Start dev server in background
deno task start &
sleep 1 && open http://localhost:8000/local

# Stop server
kill %deno
```

### Running Tests

```bash
deno task test
# or from root: deno task test:web
```

## Architecture

### Fresh Framework

The web package uses [Fresh](https://fresh.deno.dev/), a modern web framework
for Deno:

- **File-based routing** - Routes defined by file structure
- **Island architecture** - Interactive components load only when needed
- **Server-side rendering** - Fast initial page loads
- **Zero config** - Minimal setup required

### Preact Components

Interactive UI uses [Preact](https://preactjs.com/):

- Lightweight React alternative (~3KB)
- Same API as React
- Full hooks support
- Signals for state management

### Styling

Uses [Twind](https://twind.dev/) for styling:

- TailwindCSS-in-JS
- No build step required
- Dynamic class generation
- Small bundle size

## Development Guidelines

### Adding Routes

Create files in [routes/](routes/):

```typescript
// routes/example.tsx
import { PageProps } from "$fresh/server.ts";

export default function Example(props: PageProps) {
  return <div>Example page</div>;
}
```

### Adding Islands (Interactive Components)

Create files in [islands/](islands/):

```typescript
// islands/MyComponent.tsx
import { useState } from "preact/hooks";

export default function MyComponent() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### Using HC in the Browser

```typescript
import { execute } from "@swanfactory/hclang";

// Execute HC code
const result = execute("1 + 1");
console.log(result); // "2"
```

### Testing

- Write tests in [tests/](tests/)
- Use `@std/expect` for assertions
- Run with: `deno test`

## Project Structure

```
web/
├── routes/           # Pages and API endpoints
├── islands/          # Interactive client components
├── static/           # Static assets
│   ├── index.html   # Standalone HC interface
│   └── ...
├── tests/           # Test files
├── main.ts          # Server entry point
├── dev.ts           # Development server
├── mod.ts           # Public exports
└── deno.json        # Configuration
```

## Important Features

### Standalone Mode

The [static/index.html](static/index.html) file is completely self-contained:

- No server required
- Works offline (after initial load)
- Can be deployed to any static host
- Uses CDN for dependencies

### Development Mode

The Fresh server provides:

- Hot reload on file changes
- TypeScript support
- SSR (Server-Side Rendering)
- API routes
- Development tools

## Deployment

### Static Deployment

Deploy [static/index.html](static/index.html) to any static host:

- GitHub Pages
- Netlify
- Vercel
- S3 + CloudFront
- Any web server

### Server Deployment

Deploy the Fresh app to any Deno-compatible platform:

- Deno Deploy
- Docker
- VPS with Deno installed

## Important Notes

- The standalone page works without any build process
- Fresh uses file-based routing - route files must be in [routes/](routes/)
- Islands are the only client-side JavaScript - everything else is SSR
- Twind generates CSS on-demand - no CSS files needed
- All dependencies are loaded via CDN or Deno imports
- The web package depends on `@swanfactory/hclang` for HC execution

## Common Tasks

### Add a New Page

1. Create `routes/mypage.tsx`
2. Export default component
3. Navigate to `/mypage`

### Add Interactive Component

1. Create `islands/MyIsland.tsx`
2. Import and use in any route
3. Component runs on client-side

### Style with Twind

```typescript
<div class="bg-blue-500 text-white p-4 rounded">
  Styled content
</div>;
```

### Execute HC Code

```typescript
import { execute } from "@swanfactory/hclang";

const result = execute(inputCode);
// Display result to user
```

## Browser Compatibility

The web interface supports all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

No Internet Explorer support (uses ES6+ features).
