#!/usr/bin/python
import json
from HTMLParser import HTMLParser
from lxml import html
from lxml.etree import tostring
import urllib, urllib2
import cgi

class DPHTMLParser(HTMLParser):
    def __init__(self, html_snippet):
        HTMLParser.__init__(self)
        self.comments = []
        self.feed(html_snippet)
        #self.feed(html_snippet.read())
    def handle_comment(self, data):
        self.comments.append(data)
    def get_comments(self):
        return self.comments

def get_fb_response():
    opener = urllib2.build_opener(urllib2.HTTPHandler(debuglevel=1))
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    response = opener.open("https://www.facebook.com/pages/Alhuda-Youth-Program/1471242616483881")
    return response

def extract_status_snippet(html_snippet):
    tree = html.fromstring(html_snippet)
    snippet = tree.xpath('//span[@class="userContent"]')
    return snippet

def generate_content(comments, callback):
  
    if not callback:
      return ""
      
    status_snippets = []
    for comment in comments:
        statuses = extract_status_snippet(comment)
        if statuses:
            for status in statuses:
                status_snippets.append(tostring(status))  
  
    content = callback + "(" + json.dumps({"status":status_snippets}) + ");"
    return content


f = open("ayhp_page_source.html")
response = f.read()
parser = DPHTMLParser(response)
comments = parser.get_comments()
f.close()

url_params = cgi.FieldStorage()
content = generate_content(comments, url_params.getvalue("callback"))

print "Content-type: application/json\n"
print content
