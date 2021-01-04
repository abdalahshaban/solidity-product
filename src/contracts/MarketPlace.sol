pragma solidity >=0.5.0 <0.8.0;

contract MarketPlace {
    string public name;
    uint256 public productCount = 0;
    mapping(uint256 => Product) public products;

    struct Product {
        uint256 id;
        string name;
        uint256 price;
        address payable owner;
        bool purchased;
    }

    event ProductCreated(
        uint256 id,
        string name,
        uint256 price,
        address payable owner,
        bool purchased
    );

    event ProductPurchased(
        uint256 id,
        string name,
        uint256 price,
        address payable owner,
        bool purchased
    );

    constructor() public payable {
        name = "Market Place";
    }

    function createProduct(string memory _name, uint256 _price) public {
        // Make sure parameters are correct

        //Require a valid name
        require(bytes(_name).length > 0);
        //require a valid price
        require(_price > 0);
        // increament product count
        productCount++;
        // create the product
        products[productCount] = Product(
            productCount,
            _name,
            _price,
            msg.sender,
            false
        );

        // Trigger on event

        emit ProductCreated(productCount, _name, _price, msg.sender, false);
    }

    function purchaseProduct(uint256 _id) public payable {
        // fetch the product
        Product memory _product = products[_id];
        // fetch the owner
        address payable _seller = _product.owner;
        // make sure the product id is valid
        require(_product.id > 0 && _product.id <= productCount);
        //require that there is enough Ether in the transaction
        require(msg.value >= _product.price);
        // require that the product has not been purchased already
        require(!_product.purchased);
        //require that the buyer is not the seller
        require(_seller != msg.sender);

        // transfer ownership to the buyer
        _product.owner = msg.sender;
        //  purchase it
        _product.purchased = true;
        // update the product
        products[_id] = _product;
        // pay the seller by sending them Ether
        address(uint160(_seller)).transfer(msg.value);
        // trigger an event

        emit ProductPurchased(
            productCount,
            _product.name,
            _product.price,
            msg.sender,
            true
        );
    }
}
