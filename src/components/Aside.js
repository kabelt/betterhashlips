import { FiX } from "react-icons/fi";
import { SortableItem, swapArrayPositions } from "react-sort-list";
import "./Aside.css";
import { useState } from "react";
const { createCanvas, loadImage } = require(`canvas`);

const { dialog } = window.require("@electron/remote");
const fs = window.require("fs");
const path = window.require("path");

function Aside(props) {
  const canvas = createCanvas(props.config.width, props.config.height);
  const ctx = canvas.getContext("2d");
  var metadataList = [];
  var attributesList = [];
  var dnaList = new Set();

  const buildFolders = () => {
    if (fs.existsSync(path.join(props.config.outputPath, "build"))) {
      fs.rmdirSync(path.join(props.config.outputPath, "build"), {
        recursive: true,
      });
    }
    fs.mkdirSync(path.join(props.config.outputPath, "build"));
    // fs.mkdirSync(path.join(props.config.outputPath, "build", "json"));
    fs.mkdirSync(path.join(props.config.outputPath, "build", "images"));
  };

  const swap = (dragIndex, dropIndex) => {
    let swappedFolders = swapArrayPositions(
      props.folderNames,
      dragIndex,
      dropIndex
    );

    props.setFolderNames([...swappedFolders]);
  };

  const input = (_label, _name, _initialValue, _type) => {
    return (
      <>
        <p className="aside_list_item_input_label">{_label}</p>
        <input
          type={_type || "text"}
          name={_name}
          className="aside_list_item_input"
          onChange={props.handleConfigChange}
          value={_initialValue}
        />
      </>
    );
  };

  const setPath = async (_field) => {
    let path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (path.filePaths[0]) {
      props.setConfig({
        ...props.config,
        [_field]: path.filePaths[0],
      });
    }
  };

  const filterDNAOptions = (_dna) => {
    const dnaItems = _dna.split("-");
    const filteredDNA = dnaItems.filter((element) => {
      const query = /(\?.*$)/;
      const querystring = query.exec(element);
      if (!querystring) {
        return true;
      }
      const options = querystring[1].split("&").reduce((r, setting) => {
        const keyPairs = setting.split("=");
        return { ...r, [keyPairs[0]]: keyPairs[1] };
      }, []);

      return options.bypassDNA;
    });
    return filteredDNA.join("-");
  };

  const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
    const _filteredDNA = filterDNAOptions(_dna);
    return !_DnaList.has(_filteredDNA);
  };

  const findBodyIndex = (_layers) => {
    let bodyIndex = 0;
    _layers.forEach((layer, index) => {
      if (layer.name.split("-")[1] == "Body") {
        bodyIndex = index;
      }
    })
    return bodyIndex;
  }

  const createDna = (_layers) => {
    console.log('_layers', _layers)
    let randNum = [];
    _layers.forEach((layer) => {
      // get the compatible right arm
      if (layer.name.split("-")[1] == "Arm") {
        let bodyIndex = findBodyIndex(_layers);
        console.log('bodyIndex', bodyIndex)
        console.log(`${randNum[findBodyIndex(_layers)]}`, "is added")
        return randNum.push(
          `${randNum[findBodyIndex(_layers)]}`
        );
      }
      let random = Math.floor(Math.random() * layer.elements.length);
          return randNum.push(
            `${layer.elements[random].id}:${layer.elements[random].name}`
          );
    });
    return randNum.join("-");
  };

  // previous version before implementing "toggleVarient" feature
  // const createDna = (_layers) => {
  //   let randNum = [];
  //   // let selected = {};
  //   _layers.forEach((layer) => {
  //     // get the compatible right arm
  //     console.log('layer', layer)
  //     if (layer.name.split("-")[1] == "Arm") {
  //     // if (layer.id == 5) {
  //       return randNum.push(
  //         `${randNum[1]}`
  //       );
  //     }
  //     var totalWeight = 0;
  //     layer.elements.forEach((element) => {
  //       totalWeight += element.weight;
  //     });
  //     // number between 0 - totalWeight
  //     let random = Math.floor(Math.random() * totalWeight);
  //     for (var i = 0; i < layer.elements.length; i++) {
  //       // subtract the current weight from the random weight until we reach a sub zero value.
  //       random -= layer.elements[i].weight;
  //       if (random < 0) {
  //         return randNum.push(
  //           `${layer.elements[i].id}:${layer.elements[i].name}`
  //           // `${layer.elements[i].id}:${layer.elements[i].filename}`
  //         );
  //       }
  //     }
  //   });
  //   return randNum.join("-");
  // };

  const removeQueryStrings = (_dna) => {
    // if (!_dna) {
    //   return
    // }
    const query = /(\?.*$)/;
    return _dna.replace(query, "");
  };

  const cleanDna = (_str) => {
    const withoutOptions = removeQueryStrings(_str);
    var dna = Number(withoutOptions.split(":").shift());
    return dna;
  };

  const constructLayerToDna = (_dna = "", _layers = []) => {
    let mappedDnaToLayers = _layers.map((layer, index) => {
      let selectedElement = layer.elements.find(
        (e) => e.id == cleanDna(_dna.split("-")[index])
      );
      return {
        name: layer.name,
        selectedElement: selectedElement,
      };
    });
    return mappedDnaToLayers;
  };

  const loadLayerImg = async (_layer) => {
    try {
      return new Promise(async (resolve) => {
        const image = await loadImage(`file://${_layer.selectedElement.path}`);
        resolve({ layer: _layer, loadedImage: image });
      });
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const addAttributes = (_element) => {
    let selectedElement = _element.layer.selectedElement;
    attributesList.push({
      trait_type: _element.layer.name,
      value: selectedElement.name,
    });
  };

  const drawElement = (_renderObject, _index) => {
    ctx.drawImage(
      _renderObject.loadedImage,
      0,
      0,
      props.config.width,
      props.config.height
    );

    addAttributes(_renderObject);
  };

  const saveImage = (_editionCount) => {
    const url = canvas.toDataURL("image/png");
    const base64Data = url.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(
      path.join(
        props.config.outputPath,
        "build",
        "images",
        `${_editionCount}.png`
      ),
      base64Data,
      "base64"
    );
  };

  // const addMetadata = (_dna, _edition) => {
  //   let dateTime = Date.now();
  //   let tempMetadata = {
  //     name: `${props.config.name} #${_edition}`,
  //     description: props.config.description,
  //     image: `REPLACE/${_edition}.png`,
  //     edition: _edition,
  //     date: dateTime,
  //     attributes: attributesList,
  //     compiler: "HashLips Art Engine",
  //   };
  //   metadataList.push(tempMetadata);
  //   attributesList = [];
  // };

  // const saveMetaDataSingleFile = (_editionCount) => {
  //   let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  //   fs.writeFileSync(
  //     path.join(
  //       props.config.outputPath,
  //       "build",
  //       "json",
  //       `${_editionCount}.json`
  //     ),
  //     JSON.stringify(metadata, null, 2)
  //   );
  // };

  // const writeMetaData = (_data) => {
  //   fs.writeFileSync(
  //     path.join(props.config.outputPath, "build", "json", `_metadata.json`),
  //     _data
  //   );
  // };

  const prepareLayers = (folderNames) => {
    var _layers = [];
    folderNames.forEach((layer, index) => {
      if (layer.enabledElementsCount == 0 || (layer.name.split("-")[1] == "Arm" && folderNames[findBodyIndex(folderNames)].enabledElementsCount == 0)) {
        return
      }
      _layers.push(JSON.parse(JSON.stringify(layer)))
      var _enabledElements = [];
      layer.elements.forEach((element) => {
        if (element.enabled == true) {
          _enabledElements.push(element)
        }
      });
      _layers[_layers.length - 1].elements = _enabledElements
    })
    return _layers;
  }

  // Hashlips' implementation, left for future development
  // const prepareLayers = async (folderNames) => {
  //   var _layers = JSON.parse(JSON.stringify(folderNames));
  //   var availableLayerIndex = 0;
  //   _layers.forEach((layer, index) => {
  //     if (layer.enabledElementsCount == 0) {
  //       _layers.splice(index, 1)
  //       return
  //     }
  //     var _enabledElements = [];
  //     layer.elements.forEach((element) => {
  //       if (element.enabled == true) {
  //         _enabledElements.push(element)
  //       }
  //     });
  //     _layers[availableLayerIndex].elements = _enabledElements
  //     availableLayerIndex++;
  //   })
  //   return _layers;
  // }

  const startCreating = async () => {
    props.setProgress(0);
    let editionCount = 1;
    let failedCount = 0;
    let layers = prepareLayers(props.folderNames);
    while (editionCount <= props.config.supply) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          ctx.clearRect(0, 0, props.config.width, props.config.height);
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(renderObject, index);
          });

          saveImage(editionCount);
          // addMetadata(newDna, editionCount);
          // saveMetaDataSingleFile(editionCount);
          console.log(`Created edition: ${editionCount}`);
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        props.setProgress(editionCount - 1);
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= 1000) {
          console.log(
            `You need more layers or elements to grow your edition to ${props.config.supply} artworks!`
          );
          process.exit();
        }
      }
    }
    // writeMetaData(JSON.stringify(metadataList, null, 2));
  };

  // Metadata ====================

  // const updateMetadata = () => {
  //   let rawdata = fs.readFileSync(
  //     path.join(props.config.outputPath, "build", "json", `_metadata.json`)
  //   );
  //   let data = JSON.parse(rawdata);

  //   data.forEach((item) => {
  //     item.name = `${props.config.name} #${item.edition}`;
  //     item.description = props.config.description;
  //     item.image = `${props.config.baseUri}/${item.edition}.png`;

  //     fs.writeFileSync(
  //       path.join(
  //         props.config.outputPath,
  //         "build",
  //         "json",
  //         `${item.edition}.json`
  //       ),
  //       JSON.stringify(item, null, 2)
  //     );
  //   });

  //   fs.writeFileSync(
  //     path.join(props.config.outputPath, "build", "json", `_metadata.json`),
  //     JSON.stringify(data, null, 2)
  //   );

  //   console.log(`Updated baseUri for images to ===> ${props.config.baseUri}`);
  //   console.log(
  //     `Updated description for images to ===> ${props.config.description}`
  //   );
  //   console.log(`Updated name prefix for images to ===> ${props.config.name}`);
  // };

  const generate = async() => {
    props.setStatus("");
    if (props.config.supply <= 0) {
      props.setStatus("Your need to increase the supply.");
      return;
    }
    if (props.folderNames.length == 0) {
      props.setStatus(
        "Make sure to get the folder with only image files in them."
      );
      return;
    }
    // check if it has enough layers
    var max_possible = 1;
    props.folderNames.map((item,index) => {
        max_possible *= item.elements.length
    })
    if (max_possible < props.config.supply){
      props.setStatus("Insufficient varients, consider adding more or reducing supply");
    }
    // To enforce future rules
    // fs.readFile('./rules.txt', 'utf8' , (err, _rules) => {
    //   if (err) {
    //     console.error(err)
    //     return
    //   }
    //   var rules = [];
    //   _rules.split("+").map((rule) => {
    //     rules.push(rule.split("\n").filter(function(e){return e}))
    //   })
    //   props.setRules(rules)
    // })
    buildFolders();
    startCreating();
  };

  return (
    <aside className={`aside ${props.sideBarOpen && "active"}`}>
      <div className="aside_close-icon">
        <FiX onClick={() => props.toggleSideBar()} />
      </div>
      <ul className="aside_list">
        <details className="aside_list_item">
          <summary className="feature_header">Configuration</summary>
          <div>
            {input("Supply", "supply", props.config.supply, "number")}
            {/* {input("Name", "name", props.config.name)} */}
            {/* {input("Symbol", "symbol", props.config.symbol)} */}
            {/* {input("Description", "description", props.config.description)} */}
            {input("Width", "width", props.config.width, "number")}
            {input("Height", "height", props.config.height, "number")}
          </div>
        </details>
        <details className="aside_list_item">
          <summary  className="feature_header">Paths</summary>
          {input("Input Path", "inputPath", props.config.inputPath)}
          <button
            className="aside_list_item_button"
            onClick={() => setPath("inputPath")}
          >
            Set Input Path
          </button>
          {input("Output Path", "outputPath", props.config.outputPath)}
          <button
            className="aside_list_item_button"
            onClick={() => setPath("outputPath")}
          >
            Set Output Path
          </button>
        </details>



        <details className="aside_list_item">
          <summary className="feature_header">Layer order</summary>
          <p className="aside_list_item_input_label">Input folders</p>
          <button className="aside_list_item_button" onClick={props.getFolders}>
            Get Folders
          </button>
          {props.folderNames.map((folder, index) => {
            return (
              <SortableItem
                items={props.folderNames}
                id={folder.id}
                key={folder.id}
                swap={swap}
              >
                <div className="aside_list_item_filename_container">
                  <p>{folder.name}</p>
                </div>
              </SortableItem>
            );
          })}
        </details>
        <details className="aside_list_item">
          <summary className="feature_header">Create</summary>
          <p className="aside_list_item_input_label">Images</p>
          <button
            className="aside_list_item_button"
            onClick={async () => {
              generate();
            }}
          >
            Generate
          </button>
        </details>
      </ul>
    </aside>
  );
}

export default Aside;
