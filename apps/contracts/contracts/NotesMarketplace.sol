// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BountyBasedNotes {
    using SafeERC20 for IERC20;

    enum Status { Open, Closed }

    struct Request {
        uint256 id;
        address requester;
        bytes32 contentHash;
        uint256 reward;
        address token;
        Status status;
    }

    struct Offer {
        address seller;
    }

    uint256 private _nextRequestId = 1;
    mapping(uint256 => Request) public requests;
    mapping(uint256 => Offer[]) public offersByRequest;

    mapping(address => uint256) public reputation;
    mapping(address => uint256) public completedTasks;

    event RequestCreated(
        uint256 indexed requestId,
        address indexed requester,
        bytes32 indexed contentHash,
        uint256 reward,
        address token
    );

    event OfferSubmitted(
        uint256 indexed requestId,
        address indexed seller
    );

    event OfferAccepted(
        uint256 indexed requestId,
        address indexed seller,
        uint256 reward
    );

    event RequestCancelled(
        uint256 indexed requestId,
        address indexed requester,
        uint256 reward
    );

    event ReputationUpdated(
        address indexed student,
        uint256 newAverage
    );

    function createRequest(
        bytes32 _contentHash,
        address _token,
        uint256 _amount
    ) external payable {
        require(_amount > 0, "La recompensa debe ser mayor a 0");

        if (_token == address(0)) {
            require(msg.value == _amount, "Monto de CELO incorrecto");
        } else {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        uint256 requestId = _nextRequestId;
        requests[requestId] = Request({
            id: requestId,
            requester: msg.sender,
            contentHash: _contentHash,
            reward: _amount,
            token: _token,
            status: Status.Open
        });

        _nextRequestId += 1;

        emit RequestCreated(requestId, msg.sender, _contentHash, _amount, _token);
    }

    function offerNote(uint256 _requestId) external {
        Request memory req = requests[_requestId];
        require(req.id != 0, "Solicitud no existe");
        require(req.status == Status.Open, "Solicitud cerrada");

        offersByRequest[_requestId].push(
            Offer({ seller: msg.sender })
        );

        emit OfferSubmitted(_requestId, msg.sender);
    }

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

        req.status = Status.Closed;

        if (req.token == address(0)) {
            (bool sent, ) = payable(selectedOffer.seller).call{value: req.reward}("");
            require(sent, "Transferencia de CELO fallida");
        } else {
            IERC20(req.token).safeTransfer(selectedOffer.seller, req.reward);
        }

        reputation[selectedOffer.seller] += rating;
        completedTasks[selectedOffer.seller] += 1;

        uint256 newAverage = reputation[selectedOffer.seller] /
            completedTasks[selectedOffer.seller];

        emit ReputationUpdated(selectedOffer.seller, newAverage);

        emit OfferAccepted(_requestId, selectedOffer.seller, req.reward);
    }

    function cancelRequest(uint256 _requestId) external {
        Request storage req = requests[_requestId];
        require(req.id != 0, "Solicitud no existe");
        require(req.status == Status.Open, "Solicitud ya cerrada");
        require(msg.sender == req.requester, "Solo el solicitante puede cancelar");

        req.status = Status.Closed;

        if (req.token == address(0)) {
            (bool sent, ) = payable(req.requester).call{value: req.reward}("");
            require(sent, "Transferencia de CELO fallida");
        } else {
            IERC20(req.token).safeTransfer(req.requester, req.reward);
        }

        emit RequestCancelled(_requestId, req.requester, req.reward);
    }

    function getOffers(uint256 _requestId)
        external
        view
        returns (address[] memory)
    {
        Offer[] storage offers = offersByRequest[_requestId];
        address[] memory sellers = new address[](offers.length);
        for (uint256 i = 0; i < offers.length; i++) {
            sellers[i] = offers[i].seller;
        }
        return sellers;
    }

    function getRequestCount() external view returns (uint256) {
        return _nextRequestId - 1;
    }

    function getRequest(uint256 _requestId)
        external
        view
        returns (
            uint256 id,
            address requester,
            bytes32 contentHash,
            uint256 reward,
            address token,
            Status status
        )
    {
        Request memory req = requests[_requestId];
        return (
            req.id,
            req.requester,
            req.contentHash,
            req.reward,
            req.token,
            req.status
        );
    }
}
