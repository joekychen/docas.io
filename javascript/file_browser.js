// Generated by CoffeeScript 1.3.1

/*
# GitHub Styled File Browser
# (c) Copyright 2012 Baoshan Sheng
*/


(function() {
  var breadcrumb_template, file_browser, gitmodules_cache, list_template, process_gitmodules, process_index, update_usernames, usernames,
    __slice = [].slice;

  breadcrumb_template = _.template(['<% _.each(path, function(dir, i) { %>', '<%   if (i < path.length - 1) { %>', '<a depth=<%= i %>><%- dir %></a>&nbsp;/&nbsp;', '<%   } else { %>', '<span><%- dir %></span>', '<%   } %>', '<% }) %>'].join(''));

  list_template = _.template(['<div depth="<%= index_depth %>" class="filelist">', '<table>', '<thead><tr><th></th><th>name</th><th>size</th><th>sloc</th><th>age</th><th>message<div class="history"><a target="_blank" href="https://github.com/<%= user %>/<%= repo %>/commits/master">history</a></div></th></tr></thead>', '<tbody>', '<% if(index_depth) { %>', '<tr class="directory"><td></td><td><a backward>..</a></td><td></td><td></td><td></td><td></td></tr>', '<% } %>', '<% _.each(entries, function(entry) { %>', '<tr class="<%= entry.submodule ? "submodule" : entry.documented ? "document" : entry.type %>">', '<td class="icon"></td>', '<td><a ', "<%= entry.type == 'directory' && !entry.submodule ? 'forward' :    'href=\"' + (entry.submodule ? 'https://github.com/' + entry.submodule : (entry.documented ? (relative_base ? relative_base + '/' : '') + entry.document : 'https://github.com/' + user + '/' + repo + '/blob/master/' + (absolute_base ? absolute_base + '/' : '') + entry.name)) + '\"' %>", '><%- entry.name %></a></td>', '<td><span><%- entry.type == "file" ? entry.size : "—" %></span></td>', '<td><span><%= isNaN(entry.sloc) ? "—" : (entry.sloc + " " + (entry.sloc > 1 ? "lines" : "line")) %></span></td>', '<td><%- entry.modified %></td>', '<td><div><span><%- entry.subject  %></span><span class="file_browser_author" email="<%- entry.email %>"> [<%- entry.author %>]</span></div></td>', '</tr>', '<% }); %>', '</tbody>', '</table>', '</div>'].join(''));

  gitmodules_cache = {};

  process_gitmodules = function(gitmodules) {
    gitmodules = gitmodules.split(/\[[^\]]*\]/);
    gitmodules = gitmodules.slice(1);
    return gitmodules.reduce(function(hash, submodule) {
      var match;
      match = submodule.match(/path = (.*)\n.*url = git@github\.com:(.*)\.git/);
      hash[match[1]] = match[2];
      return hash;
    }, {});
  };

  file_browser = function(user, repo, index_path, index_depth, current_depth) {
    var get_index, gitmodules;
    if (index_depth == null) {
      index_depth = 0;
    }
    if (current_depth == null) {
      current_depth = index_depth;
    }
    get_index = function() {
      return $.get(index_path, function(index) {
        var absolute_base, breadcrumb_end, breadcrumb_path, breadcrumb_start, current_table, depth_offset, direction, relative_base, table, width;
        breadcrumb_path = index_path.split('/');
        breadcrumb_end = breadcrumb_path.length - 2;
        breadcrumb_start = breadcrumb_end - index_depth + 1;
        breadcrumb_path = breadcrumb_path.slice(breadcrumb_start, breadcrumb_end + 1 || 9e9);
        $('#breadcrumb').html(breadcrumb_template({
          path: [repo].concat(__slice.call(breadcrumb_path))
        }));
        $('#breadcrumb a').click(function() {
          var new_depth, new_path;
          new_depth = $(this).attr('depth') * 1;
          new_path = index_path.split('/');
          new_path.splice(new_path.length - index_depth + new_depth - 1, index_depth - new_depth);
          return new file_browser(user, repo, new_path.join('/'), new_depth, current_depth);
        });
        absolute_base = breadcrumb_path.join('/');
        depth_offset = index_depth - current_depth;
        if (depth_offset > 0) {
          relative_base = breadcrumb_path.slice(breadcrumb_path.length - depth_offset).join('/');
        } else {
          relative_base = new Array(-depth_offset + 1).join('../');
        }
        table = $(list_template({
          user: user,
          repo: repo,
          index_depth: index_depth,
          absolute_base: absolute_base,
          relative_base: relative_base,
          entries: process_index(index, gitmodules_cache[user + '/' + repo], absolute_base)
        }));
        update_usernames(table);
        $(table).find('a[backward]').click(function() {
          var new_path;
          new_path = index_path.split('/');
          new_path.splice(new_path.length - 2, 1);
          return new file_browser(user, repo, new_path.join('/'), index_depth - 1, current_depth);
        });
        $(table).find('a[forward]').click(function() {
          var new_path;
          new_path = index_path.split('/');
          new_path.splice(new_path.length - 1, 0, $(this).html());
          return new file_browser(user, repo, new_path.join('/'), index_depth + 1, current_depth);
        });
        current_table = $('#filelists div:first-child')[0];
        if (current_table) {
          direction = index_depth > parseInt($(current_table).attr('depth')) ? 1 : -1;
          width = $(current_table).width() + parseInt($(current_table).css('margin-right'));
          $('#filelists')[direction < 0 ? 'prepend' : 'append'](table);
          if (direction === -1) {
            $(table).css('margin-left', -width);
          }
          return $($('#filelists').children()[0]).animate({
            'margin-left': (direction === -1 ? '+' : '-') + '=' + width
          }, function() {
            return $(current_table).remove();
          });
        } else {
          return $('#filelists').append(table);
        }
      });
    };
    if (gitmodules_cache.hasOwnProperty(user + '/' + repo)) {
      return get_index();
    } else {
      gitmodules = index_path.split('/');
      gitmodules = gitmodules.slice(0, (gitmodules.length - index_depth - 3) + 1 || 9e9);
      gitmodules.push('gitmodules');
      gitmodules = gitmodules.join('/');
      return $.get(gitmodules, function(data) {
        gitmodules_cache[user + '/' + repo] = process_gitmodules(data);
        console.log('gitmodules', gitmodules_cache);
        return get_index();
      }).error(function() {
        gitmodules_cache[user + '/' + repo] = {};
        return get_index();
      });
    }
  };

  process_index = function(index, gitmodules, base) {
    var entries, lines;
    lines = index.split('\n').filter(function(line) {
      return line;
    });
    entries = [];
    _.each(lines, function(line) {
      var entry, match;
      match = line.match(/"(d|-)","(\d+)","([^"]+)","(.+)","(.+)","(.+)","<(.+)>","(0|1)","(\d+|-)"/);
      if (!match) {
        return;
      }
      entry = {
        type: match[1] === 'd' ? 'directory' : 'file',
        size: filesize(parseInt(match[2], 10), true),
        modified: moment(new Date(match[3])).fromNow(),
        email: match[4],
        author: match[5],
        subject: match[6],
        name: match[7],
        documented: match[8] === '1',
        sloc: parseInt(match[9], 10),
        submodule: gitmodules[base + '/' + match[7]]
      };
      if (entry.documented) {
        entry.document = entry.name.replace(/\.[^/.]+$/, '') + '.html';
      }
      if (entry.document === '.html') {
        entry.document = entry.name + '.html';
      }
      return entries.push(entry);
    });
    return _.sortBy(entries, function(entry) {
      return [entry.type, entry.name];
    });
  };

  usernames = {};

  update_usernames = function(table) {
    return _.chain($(table).find('span[email]')).map(function(span) {
      return $(span).attr('email');
    }).union().each(function(email) {
      var username;
      console.log(email);
      if (usernames.hasOwnProperty(email)) {
        username = usernames[email];
        if (username) {
          return $(table).find('span[email="' + email + '"]').html("[<a href='https://github.com/" + username + "'>" + username + "</a>]");
        }
      } else {
        return $.getJSON("https://api.github.com/legacy/user/email/" + email, function(data) {
          console.log('wow, CORS', data);
          username = data.user ? data.user.login : null;
          usernames[email] = username;
          if (username) {
            console.log($(table).find('span[email="' + email + '"]'));
            return $(table).find('span[email="' + email + '"]').html("[<a href='https://github.com/" + username + "'>" + username + "</a>]");
          }
        });
      }
    });
  };

  this.file_browser = file_browser;

}).call(this);
