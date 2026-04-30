// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NotesMarketplace
 * @dev Marketplace para vender apuntes (notes) usando cUSD en la red Mainnet de Celo.
 *
 * Funcionalidades:
 *  - Registrar un apunte con IPFS hash, precio y nombre.
 *  - Comprar un apunte pagando en cUSD. Los fondos se transfieren al vendedor.
 *  - Marcar al comprador como "autorizado" para acceder al contenido.
 *  - Verificar si un usuario tiene acceso a un apunte.
 *
 * La dirección del token cUSD en la Mainnet de Celo es:
 * 0x765DE816845861e75A25fCA122bb6898B8B1282a
 *
 * Se asume que el comprador aprueba previamente al contrato la transferencia
 * del monto necesario mediante `cUSD.approve(contractAddress, amount)`.
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

/**
 * @dev Estructura que representa un apunte (note).
 */
struct Note {
    address seller;   // propietario/vendedor del apunte
    string ipfsHash;  // hash de IPFS donde está el contenido
    uint256 price;    // precio en cUSD (en wei, 18 decimales)
    string name;      // nombre descriptivo del apunte
    bool exists;      // flag para validar existencia
}

/**
 * @dev Contrato principal del marketplace.
 */
contract NotesMarketplace {
    // Dirección del token cUSD en la Mainnet de Celo.
    address public constant CUSD_ADDRESS = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    IERC20 private immutable cUSD;

    // Contador autoincremental para generar IDs de notas.
    uint256 private nextNoteId;

    // Mapeo de ID de note => struct Note
    mapping(uint256 => Note) public notes;

    // Mapeo de ID de note => (comprador => autorizado)
    mapping(uint256 => mapping(address => bool)) private accessGranted;

    // Eventos
    event NoteListed(
        uint256 indexed noteId,
        address indexed seller,
        string name,
        uint256 price,
        string ipfsHash
    );
    event NotePurchased(
        uint256 indexed noteId,
        address indexed buyer,
        uint256 price
    );

    /**
     * @dev Constructor. Instancia la interfaz cUSD.
     */
    constructor() {
        cUSD = IERC20(CUSD_ADDRESS);
        nextNoteId = 1; // iniciamos en 1 para evitar id 0
    }

    /**
     * @dev Permite a un usuario registrar un nuevo apunte.
     * @param _ipfsHash Hash de IPFS del contenido.
     * @param _price Precio en cUSD (en wei, 18 decimales).
     * @param _name Nombre descriptivo del apunte.
     * @return noteId ID asignado al apunte registrado.
     */
    function listNote(
        string calldata _ipfsHash,
        uint256 _price,
        string calldata _name
    ) external returns (uint256 noteId) {
        require(_price > 0, "El precio debe ser mayor a 0");
        require(bytes(_ipfsHash).length > 0, "IPFS hash requerido");
        require(bytes(_name).length > 0, "Nombre requerido");

        noteId = nextNoteId;
        notes[noteId] = Note({
            seller: msg.sender,
            ipfsHash: _ipfsHash,
            price: _price,
            name: _name,
            exists: true
        });

        // El vendedor siempre tiene acceso a su propio apunte
        accessGranted[noteId][msg.sender] = true;

        emit NoteListed(noteId, msg.sender, _name, _price, _ipfsHash);

        nextNoteId += 1;
    }

    /**
     * @dev Compra un apunte pagando en cUSD.
     *      El comprador debe haber llamado `cUSD.approve(contractAddr, amount)` previamente.
     * @param _noteId ID del apunte a comprar.
     */
    function purchaseNote(uint256 _noteId) external {
        Note memory note = notes[_noteId];
        require(note.exists, "Apunte inexistente");
        require(!accessGranted[_noteId][msg.sender], "Ya tiene acceso al apunte");

        // Transferir cUSD del comprador al vendedor
        bool success = cUSD.transferFrom(msg.sender, note.seller, note.price);
        require(success, "Transferencia de cUSD fallida");

        // Conceder acceso al comprador
        accessGranted[_noteId][msg.sender] = true;

        emit NotePurchased(_noteId, msg.sender, note.price);
    }

    /**
     * @dev Verifica si un usuario tiene acceso al contenido del apunte.
     * @param _noteId ID del apunte.
     * @param _user Dirección del usuario a consultar.
     * @return true si el usuario es el vendedor o ha comprado el apunte.
     */
    function hasAccess(uint256 _noteId, address _user) external view returns (bool) {
        return accessGranted[_noteId][_user];
    }

    /**
     * @dev Obtiene la información pública de un apunte.
     *      Sólo se devuelve el IPFS hash si el solicitante tiene acceso.
     * @param _noteId ID del apunte.
     * @return seller Dirección del vendedor.
     * @return price Precio en wei.
     * @return name Nombre descriptivo.
     * @return ipfsHash Hash de IPFS (solo si tiene acceso, de lo contrario string vacío).
     */
    function getNote(uint256 _noteId) external view returns (
        address seller,
        uint256 price,
        string memory name,
        string memory ipfsHash
    ) {
        Note memory note = notes[_noteId];
        require(note.exists, "Apunte inexistente");

        seller = note.seller;
        price = note.price;
        name = note.name;

        if (accessGranted[_noteId][msg.sender]) {
            ipfsHash = note.ipfsHash;
        } else {
            ipfsHash = "";
        }
    }
}
