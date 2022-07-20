## General Form

```js
// command
{
  protocolVersion: number // e.g., 1.0, -> type to support decimal/semver number?
  name: string            // command name -- e.g., "take-screenshot"
  key: string,            // uuid
  payload?: any             // a json object -> type?
}

// response
{
  protocolVersion: 1.0,
  name: command-name,
  key: uuid,
  nextPath: string, // e.g., SHARED_ID/1.
                    // NOTE: This will also be published via applitools_nml
                    //       label in the app itself.
  result?: any,     // result of the request if it was finished successfully
  error?: error     // error object if exception was thrown during action processing
}
```

## Specific Commands

### Take Screenshot (Classic)

```js
// command
{
    protocolVersion: 1.0,
    name: 'takeScreenshot',
    key: uuid
    payload: {
        type: 'classic'
        name?: string // for debugging (could be a step name)
        region? string | Selector | Region
        fully?: boolean 
        selectorsToFindRegionsFor? [Selector, ...]
        scrollRootElement? Selector | CommonSelector
        hideScrollBars?: boolean 
        hideCaret?: boolean
        withStatusBar?: boolean
        overlap?: Region // stitch-overlap
        // frames
        // wait
        // stabilization
        // *** Future suggestions:
        // sendVHS?: boolean // default=false, for debugging classic
        // debugScreenshots? boolean // default=false
    }
}

// response
{ 
    protocolVersion: 1.0,
    name: 'takeScreenshot',
    key": string, // Same uuid that was sent in the command request
    nextPath: 'SHARED_ID/SDK/1',
    result: ClassicPayload, // see Payload section (below) for details
}
```

### Take Screenshot (NMG)

```js
// command
{
    protocolVersion: 1.0,
    name: 'takeScreenshot',
    key: uuid
    payload: {
        type: 'nmg'
        name?: string // for debugging (could be a step name)
        resourceSeparation?: boolean // disableBrowserFetching=true
        deviceList?:DeviceInfo[] // see Payload section (below) for details
        fully?: boolean
        target-region?: SelectorObject 
        scrollRootElement?: SelectorObject
        selectorsToFindRegionsFor?: [selector, ...],
        enableMultipleResultsPerSelector?: boolean,
        // *** Future suggestions:
        // hooks?: {beforeCaptureScreenshot: string} 
    }
}

// response
{ 
    protocolVersion: 1.0,
    name: 'takeScreenshot',
    key": string, // Same uuid that was sent in the command request
    nextPath: 'SHARED_ID/SDK/1'
    result: NmgPayLoad // see Payload section (below) for details
}
```
