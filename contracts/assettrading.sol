pragma solidity >=0.4.22 <0.6.0;

contract AssetTrading {
    address public contractOwner;

    uint public lastOrderId = 0;
    uint public lastAssetId = 0;
    uint internal nonce = 0;

    mapping (string => uint) public supportedAssets;
    mapping (uint => string) public idToSupportedAsset;
    mapping (uint => mapping(address => bool)) public watchers;
    mapping (uint => address[]) public watchersList;
    mapping (uint => Order) public orders;
    mapping (uint => Trade) public trades;

    struct Order {
        address creator;
        uint buyAmount;
        string buyType;
        uint sellAmount;
        string sellType;
    }

    struct Trade {
        address makerAddress;
        address takerAddress;
        address[] buyAssetWatchers;
        address[] sellAssetWatchers;
        // TODO extend
    }

    constructor() public {
        contractOwner = msg.sender;
        addSupportForAsset("BTC");
        addSupportForAsset("XRP");
    }

    /*
    Supported asset management
    */
    function addSupportForAsset(string memory asset) public {
        require(msg.sender == contractOwner);
        lastAssetId++;
        supportedAssets[asset] = lastAssetId;
        idToSupportedAsset[lastAssetId] = asset;
    }

    function removeSupportForAsset(string memory asset) public {
        require(msg.sender == contractOwner);
        delete supportedAssets[asset];

        // TODO remove all the orders with this asset
    }

    /*
    Order management
    */
    function makeOrder(uint buyAmount, string memory buyType, uint sellAmount, string memory sellType) public returns (uint id) {
        // TODO checks!
        require(supportedAssets[buyType] != 0);
        require(supportedAssets[sellType] != 0);

        // TODO do we require at least a specific number of watchers?

        lastOrderId++;

        Order memory order;
        order.creator = msg.sender;
        order.buyAmount = buyAmount;
        order.buyType = buyType;
        order.sellAmount = sellAmount;
        order.sellType = sellType;
        orders[lastOrderId] = order;

        return lastOrderId;
    }

    function cancelOrder(uint order_id) public {
        require(orders[order_id].creator == msg.sender);
        delete orders[order_id];
    }

    function takeOrder(uint order_id) public {
        //require(orders[order_id]);

        Order memory order = orders[order_id];

        // create a new trade
        Trade memory trade;
        trade.makerAddress = order.creator;
        trade.takerAddress = msg.sender;
        trades[order_id] = trade;

        // select watchers for both chains
        address[] memory allBuyAssetWatchers = watchersList[supportedAssets[order.buyType]];
        address[] memory allSellAssetWatchers = watchersList[supportedAssets[order.sellType]];

        uint buyAssetWatcherIndex = random(allBuyAssetWatchers.length);
        uint sellAssetWatcherIndex = random(allSellAssetWatchers.length);
        // TODO: for now, just select everyone as watcher
        for(uint i = 0; i < allBuyAssetWatchers.length; i++) {
            trades[order_id].buyAssetWatchers.push(allBuyAssetWatchers[i]);
        }
        for(uint i = 0; i < allSellAssetWatchers.length; i++) {
            trades[order_id].sellAssetWatchers.push(allSellAssetWatchers[i]);
        }
        
        // TODO magic
    }

    /*
    Watcher management
    */
    function registerAsWatcher(uint[] memory watchingAssets) public {
        for(uint i = 0; i < watchingAssets.length; i++) {
            uint assetId = watchingAssets[i];
            // check if the asset type exists
            require(bytes(idToSupportedAsset[assetId]).length > 0);
            // check if this user is not already watching this asset
            require(!watchers[assetId][msg.sender]);
            watchers[assetId][msg.sender] = true;
            watchersList[assetId].push(msg.sender);
        }
        // TODO collateral?
    }

    // TODO remove watcher?

    /*
    Utilities
    */
    function random(uint maxNumber) internal returns (uint) {
        // WARNING: we are aware that this is not a secure mechanism to generate random numbers!
        // To improve this, we should use an on-chain oracle.
        // For now, however, we use this method for uint testing.
        uint randomnumber = uint(keccak256(abi.encodePacked(now, msg.sender, nonce))) % maxNumber;
        nonce++;
        return randomnumber;
    }

}
