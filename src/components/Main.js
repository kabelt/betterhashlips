import Canvas from "./Canvas";
import "./Main.css";

const toggleLayer = async (folderNames, setFolderNames, index) => {
  var _folderNames = folderNames
  _folderNames[index].enabled = !_folderNames[index].enabled
  for (var i = 0; i < _folderNames[index].elements.length; i++) {
    _folderNames[index].elements[i].enabled = _folderNames[index].enabled
  }
  _folderNames[index].enabledElementsCount = _folderNames[index].enabled ? _folderNames[index].elements.length : 0;
  setFolderNames([..._folderNames])
}

const toggleVarient = async (folderNames, setFolderNames, index, id) => {
  var _folderNames = folderNames
  _folderNames[index].elements[id].enabled = !_folderNames[index].elements[id].enabled
  if (_folderNames[index].elements[id].enabled == true) {
    _folderNames[index].enabled = true
  }
  _folderNames[index].enabledElementsCount += _folderNames[index].elements[id].enabled == true ? 1 : -1;
  _folderNames[index].enabled = _folderNames[index].enabledElementsCount ? true : false;
  setFolderNames([..._folderNames])
}

function Main(props) {
  return (
    <main className="main">
      {/* <div className="main_info">
        <p>Supply: {props.config.supply}</p>
        <p>Name: {props.config.name}</p>
        <p>Symbol: {props.config.symbol}</p>
        <p>Description: {props.config.description}</p>
      </div> */}
      <div className="main_cards">
        <div className="card">
          <Canvas folderNames={props.folderNames} />
        </div>
        <div className="card">
          <p className="card_tree_title">Tree</p>
          {props.folderNames.length > 0 ? (
            props.folderNames.map((item, index) => {
              // Since Arm always follows Body, we don't need it here.
              if (item.name.split("-")[1] != "Arm"){
                return (
                  <details>
                    <summary className={item.enabled ? "card_tree_layer" : "card_tree_layer_disabled"}>{item.name}</summary>
                    <button className={item.enabled ? 'layer_switch_btn' : 'layer_switch_btn_disabled'} onClick={() => toggleLayer(props.folderNames, props.setFolderNames, index)}>⏻</button>
                    {item.elements.map((element) => {                      
                        return (
                          <button className={element.enabled ? 'card_tree_sub_item_title_btn' : 'card_tree_sub_item_title_btn_disabled'} onClick={() => toggleVarient(props.folderNames, props.setFolderNames, index, element.id)}>
                          ---{element.name}
                          </button>
                        );
                    })}
                  </details>
                );
              }
            })
          ) : (
            <p className="card_tree_item">
              The tree is empty. Please set the configurations.
            </p>
          )}
        </div>
      </div>
      <div className="log_info">
        <p className="log_info_title">
          Progress: {props.progress}/{props.config.supply}
        </p>
        <progress
          style={{
            width: "100%",
            height: "20px",
            marginTop: 5,
            backgroundColor: "lightGreen",
          }}
          value={props.progress}
          max={props.config.supply}
        ></progress>
        <p className="log_info_title">Status:</p>
        <p
          className="log_info_text"
          style={{ color: props.status ? "red" : "lightGreen" }}
        >
          {props.status != "" ? props.status : "Looks good"}
        </p>
      </div>
    </main>
  );
}

export default Main;
