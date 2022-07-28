package main

import (
	"encoding/json"
	"fmt"
	"time"
	"log"

	"github.com/golang/protobuf/ptypes"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type Artwork struct {
	Name string `json:"name"`
	Artist string `json:"artist"`
	Price int `json:"price"`
	Owner string `json:"owner"`
}
type HistoryQueryResult struct {
	Record    *Artwork    `json:"artwork"`
	TxId     string    `json:"txId"`
	Timestamp time.Time `json:"timestamp"`
	IsDelete  bool      `json:"isDelete"`
}

//1. IssueArtwork
func (s *SmartContract) IssueArtwork(ctx contractapi.TransactionContextInterface, name string, artist string, price int, owner string) error {
	exists, err := s.Exists(ctx, name)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the artwork %s already exists", name)
	}

	asset := Artwork {
		Name:               name,
		Artist:             artist,
		Price:              price,
		Owner:              owner,
	}
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(name, assetJSON)
}

//1-1. Exists
func (s *SmartContract) Exists(ctx contractapi.TransactionContextInterface, name string) (bool, error) {
    assetJSON, err := ctx.GetStub().GetState(name)
    if err != nil {
        return false, fmt.Errorf("failed to read from world state: %v", err)
    }

    return assetJSON != nil, nil

}

//2. ReadArtwork
func (s *SmartContract) ReadArtwork(ctx contractapi.TransactionContextInterface, name string) (*Artwork, error) {
	assetJSON, err := ctx.GetStub().GetState(name)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if assetJSON == nil {
		return nil, fmt.Errorf("the artwork %s does not exist")
	}

	var asset Artwork
	err = json.Unmarshal(assetJSON, &asset)
	if err != nil {
		return nil, err
	}

	return &asset, nil
}

//3. TransferArtwork
func (s *SmartContract) TransferArtwork(ctx contractapi.TransactionContextInterface, name string, newOwner string) error {
	assetAsBytes, err := ctx.GetStub().GetState(name)
	if err != nil {
		return fmt.Errorf("Failed to get artwork: " + err.Error())
	} else if assetAsBytes == nil {
		return fmt.Errorf("This artwork does not exists: " + name)

	}

	asset := Artwork{}
	_ = json.Unmarshal(assetAsBytes, &asset)
	asset.Owner = newOwner

	 assetJSONasBytes, err := json.Marshal(asset)
	 if err != nil {
		return err
	 }
	 err = ctx.GetStub().PutState(name, assetJSONasBytes)
	 if err != nil {
		return err
	 }
	 return nil
}

//4. GetHistoryForArtwork
func (s *SmartContract) GetArtworkHistory(ctx contractapi.TransactionContextInterface, name string) ([]HistoryQueryResult, error) {
	log.Printf("GetArtworkHistory: Artwork %v", name)

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(name)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Artwork
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &asset)
			if err != nil {
				return nil, err
			}
		} else {
			asset = Artwork{
				Name: name,
			}
		}

		timestamp, err := ptypes.Timestamp(response.Timestamp)
		if err != nil {
			return nil, err
		}

		record := HistoryQueryResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			Record:    &asset,
			IsDelete:  response.IsDelete,
		}
		records = append(records, record)
	}

	return records, nil
}

//main
func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating artwork chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting artwork chaincode: %v", err)
	}
}
