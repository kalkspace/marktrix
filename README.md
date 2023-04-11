# Collaborative Markdown docs in Matrix rooms

We are aiming to implement realtime collaboration using Markdown documents where the backend implementation is provided by any Matrix homeserver.

This means:
- This app doesn't need a specialized backend
- Works with any existing homeserver implementation
- End-to-end encryption will be possible (not yet implemented)

## Implementation

This is a basic React-based app using the official [Matrix Javascript SDK](https://github.com/matrix-org/matrix-js-sdk).

The toolchain uses [Vite](https://vitejs.dev/) with [SWC](https://github.com/vitejs/vite-plugin-react-swc).

### Authentication

The current demo only implements password-based login. If you don't trust the Demo we'd suggest using a throwaway Matrix account for the time being.

We plan to evenetually implement [OAuth 2.0 dynamic client registration](https://github.com/matrix-org/matrix-spec-proposals/pull/2966) so that you can use OAuth with whatever homeserver. Currently the MSC is pending and is waiting for implementation.

## License

This project is licensed under the 3-clause BSD license, see [LICENSE](./LICENSE.md)
