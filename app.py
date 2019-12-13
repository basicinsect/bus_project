import os
from flask import Flask, render_template, url_for, send_from_directory, jsonify, json
import db
import backend
import api

app = Flask(__name__)   
app.debug = True

[dataBase, table] = db.Init(app) #Den finaste kod jag skrivit
backend.Init()


posts = [
    {
        'author': 'Corey Schafer', 
        'title': 'Blog Post 1', 
        'content': 'First post content', 
        'date_posted': 'April 20, 2018' 
    },
    {
        'author': 'Jane Doe', 
        'title': 'Blog Post 2', 
        'content': 'Second post content', 
        'date_posted': 'April 21, 2018' 
    }] 
  
@app.route('/')
@app.route('/home')
def home():
    print('home')
    return render_template('home.html', posts = posts)
   
@app.route('/map')
def map():
    print('map')
    return render_template('map.html', title = 'Map')

@app.route('/timetable')
def timetable():
    print('time table')
    return render_template('timetable.html', title = 'Timetable', posts = posts)
 

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/icon.png')
def icon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'icon.png', mimetype='image/vnd.microsoft.icon')  

#Processed busdata, updated every 2 seconds
@app.route('/API/GetRTBusData')
def vehicle_data():
    data = backend.GetRTBusData()
    return jsonify(data)

#Raw RT ata response from trafiklab, converted to json
@app.route('/API/GetRTBusDataTest')
def vehicle_data_test():
    data = backend.GetRTBusDataTest()
    return (data)