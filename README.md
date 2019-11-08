# setup-emsdk

This actions step downloads emsdk and installs a version of Emscripten.

# Usage

```yaml
name: "emsdk"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mymindstorm/setup-emsdk@v1

      - name: Verify
        run: emcc -v
```

## Use with actions/cache

```yaml
- name: Cache emsdk
  uses: actions/cache@v1
  id: cache # This is important!
  with:
    # Set to the same folder as store-actions-cache (more below)
    path: 'emsdk-cache'
    # Set the end bit to emsdk version
    key: ${{ runner.os }}-emsdk-1.38.40

- name: Setup emsdk (cache not found)
  uses: mymindstorm/setup-emsdk@v1
  if: steps.cache.outputs.cache-hit != 'true'
  with:
    # Make sure to set a version number!
    version: 1.38.40
    # This is the name of the cache folder.
    # The cache folder will be placed in the build directory,
    #  so make sure it doesn't conflict with anything!
    store-actions-cache: 'emsdk-cache'
    # This stops it from using tc.cacheDir since we are using
    #  actions/cache.
    no-cache: true

- name: Setup emsdk (cache found)        
  uses: mymindstorm/setup-emsdk@v1
  if: steps.cache.outputs.cache-hit == 'true'
  with:
    # Make sure to set a version number!
    version: 1.38.40
    # Set to the same folder as store-actions-cache
    actions-cache-folder: 'emsdk-cache'
    no-cache: true

- name: Verify
  run: emcc -v
```

# Options

```yaml
version:
  description: 'Version to install'
  default: 'latest'
no-install:
  description: "If true will not download any version of Emscripten. emsdk will still be added to PATH."
  default: false
no-cache:
  description: "If true will not cache any downloads with tc.cacheDir."
  default: false
store-actions-cache:
  description: "Name of the folder emsdk cache will be copied to on sucessful run. This folder will go under $GITHUB_HOME (I.e. build dir)"
  default: ''
actions-cache-folder:
  description: "Set to the folder where your cached emsdk-master folder is."
  default: ''
```

See [action.yml](action.yml)
