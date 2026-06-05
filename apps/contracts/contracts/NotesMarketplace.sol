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
        string title;
        string description;
        uint256 reward;
        address token;
        Status status;
    }

    struct Offer {
        address seller;
        string link;
    }

    uint256 private _nextRequestId = 1;
    mapping(uint256 => Request) public requests;
    mapping(uint256 => Offer[]) public offersByRequest;

    mapping(address => uint256) public reputation;
    mapping(address => uint256) public completedTasks;

    event RequestCreated(
        uint256 indexed requestId,
        address indexed requester,
        string title,
        uint256 reward,
        address indexed token
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

    function createRequest(
        string calldata _title,
        string calldata _description,
        address _token,
        uint256 _amount
    ) external {
        require(_amount > 0, "La recompensa debe ser mayor a 0");
        require(_token != address(0), "Token invalido");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 requestId = _nextRequestId;
        requests[requestId] = Request({
            id: requestId,
            requester: msg.sender,
            title: _title,
            description: _description,
            reward: _amount,
            token: _token,
            status: Status.Open
        });

        _nextRequestId += 1;

        emit RequestCreated(requestId, msg.sender, _title, _amount, _token);
    }

    function offerNote(uint256 _requestId, string calldata _link) external {
        Request memory req = requests[_requestId];
        require(req.id != 0, "Solicitud no existe");
        require(req.status == Status.Open, "Solicitud cerrada");

        offersByRequest[_requestId].push(
            Offer({ seller: msg.sender, link: _link })
        );

        emit OfferSubmitted(_requestId, msg.sender, _link);
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

        IERC20(req.token).safeTransfer(selectedOffer.seller, req.reward);

        reputation[selectedOffer.seller] += rating;
        completedTasks[selectedOffer.seller] += 1;

        uint256 newAverage = reputation[selectedOffer.seller] /
            completedTasks[selectedOffer.seller];

        emit ReputationUpdated(selectedOffer.seller, newAverage);

        req.status = Status.Closed;

        emit OfferAccepted(_requestId, selectedOffer.seller, req.reward);
    }

    function getOffers(uint256 _requestId)
        external
        view
        returns (Offer[] memory)
    {
        return offersByRequest[_requestId];
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
            string memory title,
            string memory description,
            uint256 reward,
            address token,
            Status status
        )
    {
        Request memory req = requests[_requestId];
        return (
            req.id,
            req.requester,
            req.title,
            req.description,
            req.reward,
            req.token,
            req.status
        );
    }
}
