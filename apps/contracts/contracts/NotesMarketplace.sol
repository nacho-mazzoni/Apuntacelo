 // SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title BountyBasedNotes
 * @dev Sistema de recompensas (bounties) para que estudiantes soliciten apuntes y
 *      otros ofrezcan su material a cambio de CELO.
 *
 *  Flujo:
 *  1. Un usuario crea una solicitud (bounty) enviando CELO como escrow.
 *  2. Otros usuarios pueden ofrecer un link/hash del material para esa solicitud.
 *  3. El solicitante elige una oferta; el contrato transfiere la recompensa al ganador,
 *     actualiza su reputación y cierra la solicitud.
 *
 *  Todas las recompensas se manejan en la moneda nativa (CELO), por lo que
 *  las funciones son `payable` y utilizan `address payable`.
 */

contract BountyBasedNotes {
    // -------------------------------------------------------------------------
    // Enumeraciones y Structs
    // -------------------------------------------------------------------------

    enum Status { Open, Closed }

    struct Request {
        uint256 id;
        address payable requester; // quien crea el bounty
        string title;
        string description;
        uint256 reward;           // cantidad de CELO en wei (escrow)
        Status status;
    }

    struct Offer {
        address payable seller; // quien ofrece el apunte
        string link;            // IPFS hash o URL del material
    }

    // -------------------------------------------------------------------------
    // Almacenamiento
    // -------------------------------------------------------------------------

    uint256 private _nextRequestId = 1; // comenzamos en 1
    mapping(uint256 => Request) public requests;                 // requestId => Request
    mapping(uint256 => Offer[]) public offersByRequest;          // requestId => array of offers

    // --- Reputación ---------------------------------------------------------
    mapping(address => uint256) public reputation;          // puntaje total acumulado
    mapping(address => uint256) public completedTasks;     // # de tareas completadas

    // -------------------------------------------------------------------------
    // Eventos
    // -------------------------------------------------------------------------

    event RequestCreated(
        uint256 indexed requestId,
        address indexed requester,
        string title,
        uint256 reward
    );

    event OfferSubmitted(
        uint256 indexed requestId,
        address indexed seller,
        string link
    );

    event OfferAccepted(
        uint256 indexed requestId,
        address indexed seller,
        uint256 reward
    );

    event ReputationUpdated(
        address indexed student,
        uint256 newAverage
    );

    // -------------------------------------------------------------------------
    // Funciones del contrato
    // -------------------------------------------------------------------------

    /**
     * @dev Crea una nueva solicitud de apuntes.
     *      El llamante debe enviar la recompensa en CELO como `msg.value`.
     *
     * @param _title      Título descriptivo de la solicitud.
     * @param _description Descripción más detallada.
     */
    function createRequest(string calldata _title, string calldata _description)
        external
        payable
    {
        require(msg.value > 0, "La recompensa debe ser mayor a 0");

        uint256 requestId = _nextRequestId;
        requests[requestId] = Request({
            id: requestId,
            requester: payable(msg.sender),
            title: _title,
            description: _description,
            reward: msg.value,
            status: Status.Open
        });

        _nextRequestId += 1;

        emit RequestCreated(requestId, msg.sender, _title, msg.value);
    }

    /**
     * @dev Permite a un estudiante ofrecer su material para una solicitud existente.
     *
     * @param _requestId Id de la solicitud a la que se ofrece el apunte.
     * @param _link      IPFS hash o URL del material.
     */
    function offerNote(uint256 _requestId, string calldata _link) external {
        Request memory req = requests[_requestId];
        require(req.id != 0, "Solicitud no existe");
        require(req.status == Status.Open, "Solicitud cerrada");

        offersByRequest[_requestId].push(
            Offer({ seller: payable(msg.sender), link: _link })
        );

        emit OfferSubmitted(_requestId, msg.sender, _link);
    }

    /**
     * @dev El solicitante original acepta una oferta concreta y califica al vendedor.
     *
     * @param _requestId Id de la solicitud.
     * @param _offerIndex Índice de la oferta dentro del array `offersByRequest`.
     * @param rating Calificación del vendedor (1 a 5).
     */
    function acceptOffer(
        uint256 _requestId,
        uint256 _offerIndex,
        uint8 rating
    ) external {
        Request storage req = requests[_requestId];
        require(req.id != 0, "Solicitud no existe");
        require(req.status == Status.Open, "Solicitud ya cerrada");
        require(msg.sender == req.requester, "Solo el solicitante puede aceptar");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");

        Offer memory selectedOffer = offersByRequest[_requestId][_offerIndex];
        require(selectedOffer.seller != address(0), "Oferta invalida");

        // Transferir la recompensa al vendedor
        (bool sent, ) = selectedOffer.seller.call{value: req.reward}("");
        require(sent, "Error al transferir CELO");

        // Actualizar reputación del vendedor
        reputation[selectedOffer.seller] += rating;
        completedTasks[selectedOffer.seller] += 1;

        uint256 newAverage = reputation[selectedOffer.seller] /
            completedTasks[selectedOffer.seller];

        emit ReputationUpdated(selectedOffer.seller, newAverage);

        // Cerrar la solicitud
        req.status = Status.Closed;

        emit OfferAccepted(_requestId, selectedOffer.seller, req.reward);
    }

    // -------------------------------------------------------------------------
    // Funciones auxiliares (view)
    // -------------------------------------------------------------------------

    /**
     * @dev Obtiene la lista completa de ofertas para una solicitud.
     *
     * @param _requestId Id de la solicitud.
     * @return Array de ofertas.
     */
    function getOffers(uint256 _requestId)
        external
        view
        returns (Offer[] memory)
    {
        return offersByRequest[_requestId];
    }
}
