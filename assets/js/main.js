(function($){
    "use strict";

//FUNCTIONS

    //CONTENT


    async function getData(query){
        var res;
        var url = "https://kx2gapl7xc.execute-api.us-east-1.amazonaws.com/v1/?object=" + query + ".json";
        var params = {
            url: url,
            method: "GET",
            crossDomain: true,
            dataType: "json",
            contentType: 'application/json'
        };
        
        await $.ajax(params)
        
        .then(function(response){
            res = response;
        })
        .catch(function(e){
            console.error(e);
            res = false;
        });

        return res;
      
    }

    function removeSection(id){
        $(id).remove();

        $('#navbar').find('a').each(function(){
            var anchor = $(this),
                section = anchor.attr('href');

                if(section == id){
                    anchor.remove();
                }

        });

    }

    //ARTICLES

    function getArticle(article,element){
        const loader = "<div class='loading' id='article-response-" + article + "'><div class='loader'></div></div>",
              error = "<div class='response'><h1>Ops!</h1><span>Parece que alguma coisa deu errado!</span><span>Por favor, tente novamente mais tarde.</span><div class='button'>Continuar</div></div>";
        element.parent().append(loader);
        

        getData(article).then(function(response){
            if(response){
                constructArticle(response);
                $('#article-response-' + article).remove();
            }else{
                $('#article-response-' + article).html(error);
                $('#article-response-' + article + ' .button').click(function(){
                    $('#article-response-' + article).remove();
                });
            }
        })
    }

    function constructArticle(articleData){

        var articleContent = [],
            openTag = false;

        articleData.content.map(function(item){
            if(item.open){
                if(openTag){
                    articleContent.push('<p>' + item.content + '</p>');
                }else{
                    openTag = true;
                    articleContent.push('<div class="' + item.class + '"><p>' + item.content + '</p>');
                }
            }else{
                if(openTag){
                    openTag = false;
                    articleContent.push('</div><div class="' + item.class + '"><p>' + item.content + '</p></div>');
                }else{
                    articleContent.push('<div class="' + item.class + '"><p>' + item.content + '</p></div>');

                }
            }

        });
        

        $('#article-content').loadTemplate('article.html',
        {
            title: articleData.title,
            author: articleData.author,
            date: articleData.date,
            content: articleContent.join('')
        },
        {
            success: function(){

                
                $('body').css('--article-banner-src', 'url(https://guitton.adv.br/images/articles/' + articleData.banner.src + ')');
                $('body').css('--article-banner-position', articleData.banner.position);
                
                $('#article').removeClass('hide');


                //Smooth scroll
                $('#article').find(".scroll").each(function() {
                    var href = $(this).attr("href");
                    $(this).click(function(event){
                        event.preventDefault();
                        animateScrollTo(document.querySelector(href));
                    })
                });

                //Anchor
                $('#article').scrollex({
                    mode: 'top',
                    top: -$('#navbar').height(),
                    enter: function(){
                        $('#articles .fixed-anchor').removeClass('hide-opacity');
                    },
                    leave: function(){
                        $('#articles .fixed-anchor').addClass('hide-opacity');
                    }
                });
                
                setTimeout(function(){animateScrollTo(document.querySelector('#article'));},100);
            }
        }
        );

    }

    //FORM

    //Main Validation
    function validateField(field, shake = true){
        const validationTypes = ["none", "textonly", "email", "mobile", "length"],
            value = field.val(),
            type = field.attr('validation-type'),
            chars = field.attr('validation-char'),
            validationType = $.inArray(type, validationTypes),
            result = validateContent(validationType,value,chars);
            
            inputError(field,result,shake);

            return result;
    }

    //Validate Content
    function validateContent(type,value,minchar=0){
        var result = false;

        // Validation Types
        //     0 -> Number only
        //     1 -> Text only
        //     2 -> Email
        //     3 -> Mobile
        //     4 -> Length

        switch(type){
            case 0:
                result = true;
                break;
            case 1:
                value = value.replace(/\s*$/,"");
                if (value.length >= minchar && value.match(/^[A-zÀ-ÿ']+(\s)?([A-zÀ-ÿ']\s?)*[A-zÀ-ÿ']+$/)) {
                    result = true;
                }
                break;
            case 2:
                var emailregex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if(emailregex.test(value)){
                    result = true;
                }
                break;
            case 3:
                var mobileRegex = /^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$/;
                if(mobileRegex.test(value)){
                    result = true;
                }
                break;

            case 4:
                if(value.length >= minchar){
                    result = true;
                }
                break;
            default:
                console.error('No validation found: ' + value);
                break;
        }

        return result;
    }

    //Input Error
    function inputError(field,action,shake){
        if(!action){
            field.addClass('error');
            if(shake){
                field.addClass('shake');
            }
        }else{
            field.removeClass('error');
            field.removeClass('shake');
        }
    }

    //Validade Form and Submit
    $('#contact-form').submit(function(event){
        event.preventDefault();
        var submit = true;
        $(this).find(':input').each(function(){
            $(this).attr('disabled',true);
            if($(this).attr('type') != 'submit'){
                if(!validateField($(this))){
                    submit = false;
                }
            }
        });
        if(submit){
            var postData = {};
            $(this).find(':input').each(function(){
                const input = $(this),
                      name = input.attr('name'),
                      value = input.val();
                if(name){
                    postData[name] = value;
                }
            });
            sendForm(postData);            
        }else{
            $(this).find(':input').each(function(){
                if($(this).attr('type') != 'submit'){
                    $(this).attr('disabled',false);
                }
            });
        }
    });

    //Send Data
    function sendForm(postData){
        const loader = "<div class='loading' id='response'><div class='loader'></div></div>",
              success = "<div class='response'><h1>Obrigado!</h1><span>Sua mensagem foi enviada com sucesso!</span><span>Estarei entrando em contato em breve.</span></div>",
              error = "<div class='response'><h1>Ops!</h1><span>Parece que alguma coisa deu errado!</span><span>Por favor, entre em contato por telefone.</span></div>";
        $('#contact-form').append(loader);
        $('#response').css('opacity','1');
        


        $.ajax({
            type: "POST",
            url: 'https://ffjdmtiqi2.execute-api.us-east-1.amazonaws.com/contactForm',
            data: JSON.stringify(postData),
            crossDomain: true,
            dataType: "json",
            success: function(response){
                $('#response').html(success);
            },
            error: function(response){
                $('#response').html(error);
                console.error(response);
            }
        });
    }

//MASKS
    //Mobile Mask
    function mobileMask(val) {
        return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
    }
    $('#tel').mask(mobileMask, {
        onKeyPress: function(val, e, field, options) {
            field.mask(mobileMask.apply({}, arguments), options);
        }
    });

//TRIGGERS

    //Smooth scroll
    $('body').find(".scroll").each(function() {
        var href = $(this).attr("href");
        $(this).click(function(event){
            event.preventDefault();
            animateScrollTo(document.querySelector(href));
        })
    });

    //Active link
    $('#navbar').find('a').each(function(){
        var anchor = $(this),
            section = anchor.attr('href').split('#')[1];
        anchor.click(function(){
            $(this).addClass('active');
            $('#chk').prop('checked', false);
        })
        $('body').find('section').each(function(){
            if($(this).attr('id') == section){
                $(this).scrollex({
                    enter: function(){
                        anchor.addClass('active');
                    },
                    leave: function(){
                        anchor.removeClass('active');
                    },
                    top: '500px',
                    bottom: '500px',
                });
            }
        })
    });

    //Validate Fields
    $('#contact-form').find(':input').each(function(){
        if($(this).attr('type') != 'submit'){
            $(this).focus(function(){
                inputError($(this),true);
                $('#submit').attr('disabled',false);
            });
            $(this).blur(function(){
                validateField($(this),true);
            });
        }
    });   


//INIT

    //GET CONTENT SECTIONS
    getData('articles').then(function(response){
        if(response){
            const articlesData = response.articles;

            $('#articles .list').loadTemplate('articles.html', articlesData, {append:true,
            success:function(){

                $('#articles .button').each(function(){
                    $(this).click(function(){
                        getArticle($(this).attr('src'),$(this));
                    })
                }

                )}
            });
        }else{
            removeSection('#articles');
        }
    });

    getData('interviews').then(function(response){
        if(response){
            var interviewsData = response.interviews;

            interviewsData.map(function(item, index){
                var src = item.src.split('.be\/')[1];
                interviewsData[index].img = "https://i.ytimg.com/vi/" + src + "/maxresdefault.jpg";
            });

            $('#interviews .list').loadTemplate('interviews.html', interviewsData, {append:true,
            success:function(){


                $('#interviews .button').each(function(){
                    $(this).click(function(){
                    window.open($(this).attr('src'));
                    })
                }

                )}
            });
        }else{
            removeSection('#interviews');
        }
    });

    getData('juri').then(function(response){
        if(response){
            const juriData = response.juri;

            $('#juri .list').loadTemplate('juri.html', juriData, {append:true,
            success:function(){

                $('#juri .button').each(function(){
                    $(this).click(function(){
                        getArticle($(this).attr('src'),$(this));
                    })
                }

                )}
            });
        }else{
            removeSection('#juri');
        }

    })










})(jQuery);