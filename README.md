# ContentComplete

A jQuery plugin developed by Celly. See it in action https://cel.ly

ContentComplete is a jQuery library that allows you to autocomplete the current
word of a contenteditable div. The autocomplete dropdown is triggered by a
special character being typed. ContentComplete supports keyboard and mouse
controls to choose the result.

## License
ContentComplete is release under the MIT license. See COPYING for further
license information.

## Usage:

```javascript
var ccOptions = {
    "atEndpoint": "/myAtEndpoint?query=",
    "hashEndpoint": "/myHashEndpoint?query=",
    "showNoResults": true
}
$("#myDiv").contentComplete(ccOptions);
```

## Example
There is a working toy example included in the repo can be run statically off of the file
system. Note that the staticness of the example prevents real autocomplete from working,
but you should be able to get an idea of what is provided.
