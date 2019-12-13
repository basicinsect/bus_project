from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from flask import Flask

def Init(app):
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:TekniskFysik2020@94.254.77.173:45612/busspuck'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db = SQLAlchemy(app)
    class data(db.Model):
        __tablename__ = 'data'
        i           = db.Column('i', db.Integer, primary_key = True)
        ilocal      = db.Column('ilocal', db.Integer, primary_key = True)
        mac         = db.Column('mac', db.Integer, primary_key = True)
        lon         = db.Column('lon', db.Text, primary_key = True)
        lat         = db.Column('lat', db.Text, primary_key = True)
        speed       = db.Column('speed' , db.DateTime, primary_key = True) 
        dtlocal     = db.Column('dtlocal' , db.DateTime, primary_key = True) 
        dtserver    = db.Column('dtserver' , db.DateTime, primary_key = True) 
    
    return([db, data])


def GetLatestPositionFromDatabase(db, data):
    queryReturnData = db.session.query(data).filter(data.i == db.session.query(func.max(data.i)).all()[0][0])[0]
    return [float(queryReturnData.lat), float(queryReturnData.lon)]







