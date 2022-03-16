# simple way how to update assets in bridge.json
* go to https://sideshift.ai/ and click on any asset
* modal will appear with a grid of all assets
* open browser dev console (ctrl + alt + I)
* paste following into the console prompt

```js
// this will load jquery
(function(){
  var newscript = document.createElement('script');
     newscript.type = 'text/javascript';
     newscript.async = true;
     newscript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js';
  (document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(newscript);
})();
```

* copy contents of the `bridge.json` file into clipboard
* then initialize a variable `bridge` with the contents from clipboard:

```js
bridge = /*paste here contents of bridge.json*/
brirdge.map(val => {
  const li = $('li').filter(function (){
    return $(this).attr('data-method-id') == val.methodId;
  })

  const src = li.find("div > img")[0].src;
  val.logoUrl = src;
  return val;
})
```

* copy the output from console and paste it back to `bridge.json`