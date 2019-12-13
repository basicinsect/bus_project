from google.transit                     import gtfs_realtime_pb2
from google.protobuf                    import json_format
from apscheduler.schedulers.background  import BackgroundScheduler
from flask                              import jsonify

import urllib.request
import requests
import time

import os
import app

import atexit


trips = []
bussar = []

def Init():
    # Caches the trips info with row structure [tripID, routeNr, dir]
    global trips  
    trips = ReadLocalTripsInfo()

    scheduler = BackgroundScheduler()
    scheduler.add_job(func=UpdateBusData, trigger="interval", seconds=2)
    scheduler.start()

    # Shut down the scheduler when exiting the app
    atexit.register(lambda: scheduler.shutdown())

def GetRTBusData():
    global bussar 
    return sorted(bussar, key=get_line_nr)

def UpdateBusData():
    print("-")
    global bussar 
    bussar = GetRealTimePosition()

def ReadLocalTripsInfo():
    script_dir = os.path.dirname(__file__)
    rel_path = "static/txt/trips.txt"
    abs_file_path = os.path.join(script_dir, rel_path)
    file = open(abs_file_path, "r")

    ret = {}


    iterfile = iter(file)
    next(iterfile)
    for line in iterfile:    

        x = line.split(",")

        if is_number(x[0]) and int(x[0]) >= 9011003000500000 and int(x[0]) < 9011003000600000: 
            
            num_str = x[0]
            strt = ""
            i = 0

            for digit in num_str:
                if  i < 9:
                    i = i+1
                elif    i > 10: 
                    pass
                else:
                    strt = strt + digit
                    i = i+1

            ret[int(x[2])] = int(strt)

    return ret 

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def get_line_nr(elem):
    return elem[1]

def GetRealTimePosition():
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get('https://opendata.samtrafiken.se/ul/VehiclePositions.pb?key=b5f3c272a96e4631974654dec6479845')
    feed.ParseFromString(response.content)

    data = []

    nTotal = 0 
    nWizTripz = 0
    nWizTripzInTripz = 0
    for entity in feed.entity:
        nTotal = nTotal+1
        if entity.vehicle.trip.HasField("trip_id"):
            nWizTripz = nWizTripz+1
            global trips
            if int(entity.vehicle.trip.trip_id) in trips:
                nWizTripzInTripz = nWizTripzInTripz+1
                data.append( ( ( float(entity.vehicle.position.latitude), float(entity.vehicle.position.longitude) ), trips[int(entity.vehicle.trip.trip_id)] ) )
    print("Tot: " + str(nTotal), "WizTripz: " + str(nWizTripz), "nWizTripzInTripz: " + str(nWizTripzInTripz))
    return data


def GetRTBusDataTest():
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get('https://opendata.samtrafiken.se/ul/VehiclePositions.pb?key=b5f3c272a96e4631974654dec6479845')
    feed.ParseFromString(response.content)
    return json_format.MessageToJson(feed)
