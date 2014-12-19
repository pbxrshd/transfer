#!/usr/bin/python

import re

str = """
  <div class="userContentWrapper">
    <div class="_wk">
      <span data-ft="&#123;&quot;tn&quot;:&quot;K&quot;&#125;" class="userContent">
        Please keep the stan victims and thier <br /> families <br> in your <br/>duas. <span class="text_exposed_hide">...</span> May h(swt) ... protection.
      </span>
      <span 
      abcdef>
        <a href="https://www.facebook.com/l.php?u=https%3A%2F%2Fwww.mediafire.com%2F%3F7mb2o8kw7nsqhpq&amp;h=OAQFjF0pc&amp1" 
          rel="nofollow nofollow" target="_blank" 
          onmouseover="LinkshimAsyncLink.swap(this, &quot;https:\\/\\/www.mediafire.com\\/?7mb2o8kw7nsqhpq&quot;);" 
          onclick="LinkshimAsyncLink.swap(this, &quot;https:\\/\\/www.faceboqhpq&a">
          <span>https://www.mediafire.com/</span>
          <wbr />
          <span class="word_break"></span>?7mb2o8kw7nsqhpq
        </a></span>      
      <span class="text_exposed_hide">...</span>
      <a class="see_more_link" onclick="var func =; " 
             href="#" data-ft="&#123;&quot;tn&quot;:&quot;e&quot;&#125;" role="button">See More
      </a>
    </div>
    
       <a href="http://l.facebook.com/l.php?u=http%3A%2F%2Fwww.schaumburgareamuslimevents.org%2F&amp;h=pAQFMJTiS&amp;s=1" 
         rel="nofollow nofollow" target="_blank" 
         onmouseover="LinkshimAsyncLink.swap(this, &quot;http:\\/\\/www.schaumburgareamuslimevents.org\\/&quot;);" 
         onclick="LinkshimAsyncLink.swap(this, &quot;http:\\/\\/l.facebook.com\\/l.php?u=http\\u00253A\\u00252F\\u00252Fwww.schaumburgareamuslimevents.org\\u00252F&amp;...">
         www.schaumburgareamusli
       <span class="text_exposed_hide">...</span><span class="text_exposed_show">mevents.org</span>
       </a>    
    
  </div>
"""

#<a[^>]*?href="#"[^>]*?>[^>]*?</a>

#<a[^>]*?(href=".*?")[^>]*?>

# make single line
str = str.replace('\n', '')

print str

# remove span tags with content = "..."
str = re.sub(r'<span[^>]*?>\.\.\.</span>', "", str)
# remove all span tags, leaving only text content
str = re.sub(r'<span.*?>', "", str)
str = re.sub(r'</span>', "", str)
# remove all div tags, leaving only text content
str = re.sub(r'<div.*?>', "", str)
str = re.sub(r'</div>', "", str)
# remove <a tags and content from tags that have href to # anchor
str = re.sub(r'<a[^>]*?href="#"[^>]*?>[^>]*?</a>', "", str)
# collapse repeated whitespace
str = re.sub(r'\s+', " ", str)
# fix any remaining <a to have only href
str = re.sub(r'<a[^>]*?(href=".*?")[^>]*?>', r'<a \g<1>>', str)
# normalize hrefs
str = re.sub(r'href="https://www.facebook.com/l.php\?u=([^"]*?)' , r'href="\g<1>"', str)


print '-----------------------------'

print str

print 'done'
