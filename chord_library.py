#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Jun  5 10:41:57 2026

@author: arthur
"""

CHORDS = {
    "A": {
        "A shape": {
            "major": [("x, 0, 2, 2, 2, 0")],
            "minor": [("x, 0, 2, 2, 1, 0")],
            "major seven": [("x, 0, 2, 1, 2, 0")],
            "minor seven": [("x, 0, 2, 0, 1, 0")]
        }
    },
    "C": {
        "C shape": {
            "major": [("x, 3, 2, 0, 1, 0")],
            "minor": [("x, x, x, x, x, x")],
            "major seven": [("x, 3, 2, 0, 0, 0")],
            "minor seven": [("x, x, x, x, x, x")]
        }
    },
    "E": {
        "E shape": {
            "major": [("0, 2, 2, 1, 0, 0")],
            "minor": [("0, 2, 2, 0, 0, 0")],
            "major seven": [("0, x, 1, 1, 0, x")],
            "minor seven": [("0, 2 , 0, 0, 0, 0")]
        }
    },
    "D": {
        "D shape": {
            "major": [("x, x, 0, 2, 3, 2")],
            "minor": [("x, x, 0, 2, 3, 1")],
            "major seven": [("x, x, 0, 2, 2, 2")],
            "minor seven": [("x, x, 0, 2, 1, 1")]
        }
    },
    "G": {
        "G shape": {
            "major": [("3, 2, 0, 0, 0, 3")],
            "minor": [("x, x, x, x, x, x")],   
            "major seven": [("x, x, x, x, x, x")],
            "minor seven": [("x, x, x, x, x, x")]
        }
    }
}